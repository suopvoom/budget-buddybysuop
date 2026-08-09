import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, PlugZap, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAdapterStatuses, triggerSync } from "@/lib/marketplace/sync.functions";

export const Route = createFileRoute("/admin/integrations")({
  head: () => ({ meta: [{ title: "Data Sources · Admin" }, { name: "robots", content: "noindex" }] }),
  component: IntegrationsPage,
});

type Status = {
  adapterKey: string;
  displayName: string;
  dataSourceType: string;
  requiredSecrets: string[];
  missingSecrets: string[];
  configured: boolean;
  docsUrl?: string;
};

type Run = {
  id: string;
  adapter_key: string;
  status: string;
  items_processed: number;
  items_updated: number;
  items_failed: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

function IntegrationsPage() {
  const fetchStatuses = useServerFn(getAdapterStatuses);
  const sync = useServerFn(triggerSync);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [s, r] = await Promise.all([
        fetchStatuses({}),
        supabase.from("sync_runs").select("*").order("started_at", { ascending: false }).limit(25),
      ]);
      setStatuses(s as Status[]);
      setRuns((r.data ?? []) as unknown as Run[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load data sources");
    }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function run(key: string) {
    setBusy(key);
    try {
      const res = await sync({ data: { adapterKey: key } });
      if (res.status === "not_configured") toast.warning(res.error ?? "Provider not configured");
      else if (res.status === "success") toast.success(`Synced ${res.updated} listings`);
      else toast.error(res.error ?? "Sync failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    }
    setBusy(null);
    load();
  }

  return (
    <>
      <PageHeader
        title="Data Sources"
        subtitle="Official APIs, affiliate feeds and licensed providers. No source is live until its credentials are added."
        actions={<Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>}
      />
      <div className="p-8 space-y-8">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        <div className="grid gap-4 md:grid-cols-2">
          {statuses.map((s) => (
            <div key={s.adapterKey} className="rounded-xl border bg-background p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{s.displayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.dataSourceType.replace(/_/g, " ")} · key <code>{s.adapterKey}</code>
                  </p>
                </div>
                {s.configured ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Credentials present
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertTriangle className="h-4 w-4" /> Provider not configured
                  </span>
                )}
              </div>

              <div className="mt-4 text-xs">
                <p className="text-muted-foreground uppercase tracking-wider mb-1">Required credentials</p>
                <ul className="space-y-1">
                  {s.requiredSecrets.map((n) => (
                    <li key={n} className="flex items-center gap-2">
                      <span className={s.missingSecrets.includes(n) ? "text-amber-600" : "text-emerald-600"}>●</span>
                      <code>{n}</code>
                      <span className="text-muted-foreground">
                        {s.missingSecrets.includes(n) ? "missing" : "set"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" disabled={busy === s.adapterKey} onClick={() => run(s.adapterKey)}>
                  <PlugZap className="h-4 w-4 mr-1" />
                  {busy === s.adapterKey ? "Running…" : "Run sync"}
                </Button>
                {s.docsUrl && (
                  <a href={s.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                    Provider docs
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <section>
          <h2 className="text-sm font-semibold mb-3">Recent sync runs</h2>
          <div className="rounded-xl border bg-background overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Processed</th>
                  <th className="text-right px-4 py-3">Updated</th>
                  <th className="text-right px-4 py-3">Failed</th>
                  <th className="text-left px-4 py-3">Started</th>
                  <th className="text-left px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {runs.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No sync runs yet.</td></tr>
                )}
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.adapter_key}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3 text-right">{r.items_processed}</td>
                    <td className="px-4 py-3 text-right">{r.items_updated}</td>
                    <td className="px-4 py-3 text-right">{r.items_failed}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.started_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[280px] truncate">{r.error_message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
