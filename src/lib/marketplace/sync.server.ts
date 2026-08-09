// Server-only price sync engine.
// Pipeline: adapter (official API / affiliate feed / licensed provider)
//   -> normalize -> match existing listing -> update listing
//   -> insert price_history -> DB trigger fans out user price alerts.
// If no permitted provider is configured, nothing is written and the run is
// recorded as "not_configured". No data is ever invented.

import { adapters, adapterStatuses, getAdapter } from "./adapters.server";
import { ProviderNotConfiguredError } from "./types";

export type SyncResult = {
  status: "success" | "partial" | "failed" | "not_configured";
  adapterKey: string;
  processed: number;
  updated: number;
  failed: number;
  error?: string;
};

export function listAdapterStatuses() {
  return adapterStatuses();
}

export async function assertStaff(supabase: any, userId: string, adminOnly = false) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin) return "admin";
  if (adminOnly) throw new Error("Forbidden");
  const { data: isEditor } = await supabase.rpc("has_role", { _user_id: userId, _role: "editor" });
  if (!isEditor) throw new Error("Forbidden");
  return "editor";
}

export async function runMarketplaceSync(adapterKey: string): Promise<SyncResult> {
  const adapter = getAdapter(adapterKey);
  if (!adapter) throw new Error(`Unknown adapter: ${adapterKey}`);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const status = adapterStatuses().find((s) => s.adapterKey === adapterKey)!;

  const { data: run } = await supabaseAdmin
    .from("sync_runs")
    .insert({ adapter_key: adapterKey, status: "running", trigger_source: "manual" })
    .select("id")
    .single();
  const runId = run?.id as string | undefined;

  const finish = async (r: SyncResult) => {
    if (runId) {
      await supabaseAdmin
        .from("sync_runs")
        .update({
          status: r.status,
          items_processed: r.processed,
          items_updated: r.updated,
          items_failed: r.failed,
          error_message: r.error ?? null,
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }
    await supabaseAdmin
      .from("marketplace_integrations")
      .update(
        r.status === "success"
          ? { last_success_at: new Date().toISOString(), last_error: null, last_error_at: null }
          : { last_error: r.error ?? r.status, last_error_at: new Date().toISOString() },
      )
      .eq("adapter_key", adapterKey);
    return r;
  };

  if (!status.configured) {
    return finish({
      status: "not_configured",
      adapterKey,
      processed: 0,
      updated: 0,
      failed: 0,
      error: `Provider not configured — missing: ${status.missingSecrets.join(", ")}`,
    });
  }

  // Resolve which listings this adapter owns.
  const { data: integration } = await supabaseAdmin
    .from("marketplace_integrations")
    .select("marketplace_id")
    .eq("adapter_key", adapterKey)
    .maybeSingle();

  let q = supabaseAdmin
    .from("product_listings")
    .select("id, product_id, marketplace_id, external_product_id, price")
    .eq("is_active", true);
  if (integration?.marketplace_id) q = q.eq("marketplace_id", integration.marketplace_id);
  const { data: listings } = await q;

  let updated = 0;
  let failed = 0;
  let lastError: string | undefined;

  for (const l of listings ?? []) {
    if (!l.external_product_id) continue;
    try {
      const priced = await adapter.getPrice(l.external_product_id);
      const now = new Date().toISOString();
      await supabaseAdmin
        .from("product_listings")
        .update({
          price: priced.currentPrice,
          mrp: priced.mrp ?? null,
          currency: priced.currency,
          availability: priced.availability,
          in_stock: priced.availability === "in_stock",
          last_checked: now,
          last_synced_at: now,
          last_error: null,
          last_error_at: null,
          data_source: adapter.dataSourceType,
        })
        .eq("id", l.id);
      // History insert fires notify_price_drop() -> user alerts.
      await supabaseAdmin.from("price_history").insert({
        product_id: l.product_id,
        marketplace_id: l.marketplace_id,
        product_marketplace_id: l.id,
        price: priced.currentPrice,
        mrp: priced.mrp ?? null,
        availability: priced.availability,
        source: adapter.dataSourceType,
      });
      updated++;
    } catch (err) {
      failed++;
      lastError = err instanceof Error ? err.message : String(err);
      // Keep the last known good price; only record the failure.
      await supabaseAdmin
        .from("product_listings")
        .update({ last_error: lastError, last_error_at: new Date().toISOString() })
        .eq("id", l.id);
      if (err instanceof ProviderNotConfiguredError) break;
    }
  }

  return finish({
    status: failed === 0 ? "success" : updated > 0 ? "partial" : "failed",
    adapterKey,
    processed: listings?.length ?? 0,
    updated,
    failed,
    ...(lastError ? { error: lastError } : {}),
  });
}

export const knownAdapterKeys = Object.keys(adapters);
