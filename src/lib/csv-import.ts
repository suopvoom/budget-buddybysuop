import { supabase } from "@/integrations/supabase/client";
import { normalizeProductUrl } from "@/lib/marketplace/types";

export type ImportReport = {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; msg: string }[];
};

export const emptyReport = (): ImportReport => ({ created: 0, updated: 0, skipped: 0, errors: [] });

export type CsvRow = Record<string, string>;

const clean = (v: string | undefined) => (v ?? "").trim();
const num = (v: string | undefined): number | null => {
  const s = clean(v);
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const bool = (v: string | undefined, fallback = true): boolean => {
  const s = clean(v).toLowerCase();
  if (!s) return fallback;
  return ["true", "1", "yes", "y", "in_stock", "instock"].includes(s);
};

/** Resolves a product from any of sku / barcode / slug / product_id / name. */
export async function resolveProductId(row: CsvRow): Promise<string | null> {
  const id = clean(row.product_id);
  if (id) {
    const { data } = await supabase.from("products").select("id").eq("id", id).maybeSingle();
    if (data) return data.id;
  }
  for (const col of ["sku", "barcode", "slug"] as const) {
    const v = clean(row[col]);
    if (!v) continue;
    const { data } = await supabase.from("products").select("id").eq(col, v).maybeSingle();
    if (data) return data.id;
  }
  const name = clean(row.product_name) || clean(row.name);
  if (name) {
    const { data } = await supabase.from("products").select("id").ilike("name", name).limit(1);
    if (data && data[0]) return data[0].id;
  }
  return null;
}

export type Lookup = Map<string, string>;

export async function loadMarketplaces(): Promise<Lookup> {
  const { data } = await supabase.from("marketplaces").select("id, name, slug");
  const map: Lookup = new Map();
  (data ?? []).forEach((m) => {
    map.set(m.name.toLowerCase(), m.id);
    if (m.slug) map.set(m.slug.toLowerCase(), m.id);
  });
  return map;
}

/**
 * Imports marketplace listings. Duplicate detection: existing listing is matched
 * by (marketplace, normalized url) first, then by (product, marketplace).
 * Every imported price also writes a price_history row so charts stay accurate.
 */
export async function importListings(rows: CsvRow[], marketplaces: Lookup): Promise<ImportReport> {
  const r = emptyReport();
  let i = 1;
  for (const row of rows) {
    i++;
    const marketplaceKey = clean(row.marketplace).toLowerCase();
    const marketplaceId = marketplaces.get(marketplaceKey);
    const price = num(row.price) ?? num(row.current_price);
    if (!marketplaceId) {
      r.errors.push({ row: i, msg: `Unknown marketplace "${clean(row.marketplace)}"` });
      continue;
    }
    if (price === null || price <= 0) {
      r.errors.push({ row: i, msg: "Missing or invalid price" });
      continue;
    }
    const productId = await resolveProductId(row);
    if (!productId) {
      r.errors.push({ row: i, msg: "No matching product (use product_id, sku, barcode, slug or product_name)" });
      continue;
    }

    const url = clean(row.product_url) || clean(row.url);
    const normalized = url ? normalizeProductUrl(url) : null;
    const mrp = num(row.mrp);
    const discount =
      num(row.discount_percentage) ??
      (mrp && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : null);

    const payload = {
      product_id: productId,
      marketplace_id: marketplaceId,
      price,
      mrp,
      discount_pct: discount,
      url: url || null,
      normalized_url: normalized,
      external_product_id: clean(row.external_product_id) || null,
      currency: clean(row.currency) || "INR",
      availability: clean(row.availability) || (bool(row.in_stock) ? "in_stock" : "out_of_stock"),
      in_stock: bool(row.in_stock, clean(row.availability).toLowerCase() !== "out_of_stock"),
      seller: clean(row.seller_name) || clean(row.seller) || null,
      delivery: clean(row.delivery_information) || clean(row.delivery) || null,
      coupon_code: clean(row.coupon_information) || clean(row.coupon_code) || null,
      data_source: "csv_import",
      is_active: bool(row.is_active),
      last_checked: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    };

    let existingId: string | null = null;
    if (normalized) {
      const { data } = await supabase
        .from("product_listings")
        .select("id")
        .eq("marketplace_id", marketplaceId)
        .eq("normalized_url", normalized)
        .maybeSingle();
      existingId = data?.id ?? null;
    }
    if (!existingId) {
      const { data } = await supabase
        .from("product_listings")
        .select("id")
        .eq("marketplace_id", marketplaceId)
        .eq("product_id", productId)
        .maybeSingle();
      existingId = data?.id ?? null;
    }

    let listingId = existingId;
    if (existingId) {
      const { error } = await supabase.from("product_listings").update(payload).eq("id", existingId);
      if (error) {
        r.errors.push({ row: i, msg: error.message });
        continue;
      }
      r.updated++;
    } else {
      const { data, error } = await supabase.from("product_listings").insert(payload).select("id").maybeSingle();
      if (error) {
        r.errors.push({ row: i, msg: error.message });
        continue;
      }
      listingId = data?.id ?? null;
      r.created++;
    }

    const { error: histErr } = await supabase.from("price_history").insert({
      product_id: productId,
      marketplace_id: marketplaceId,
      product_marketplace_id: listingId,
      price,
      mrp,
      discount_percentage: discount,
      availability: payload.availability,
      source: "csv_import",
      ...(clean(row.recorded_at) ? { recorded_at: new Date(clean(row.recorded_at)).toISOString() } : {}),
    });
    if (histErr) r.errors.push({ row: i, msg: `Price history: ${histErr.message}` });
  }
  return r;
}

/** Imports product variants. Duplicate detection by variant sku, then (product, name, value). */
export async function importVariants(rows: CsvRow[]): Promise<ImportReport> {
  const r = emptyReport();
  let i = 1;
  for (const row of rows) {
    i++;
    const name = clean(row.variant_name) || clean(row.name);
    if (!name) {
      r.errors.push({ row: i, msg: "Missing variant_name" });
      continue;
    }
    const productId = await resolveProductId({ ...row, name: clean(row.product_name) });
    if (!productId) {
      r.errors.push({ row: i, msg: "No matching product (use product_id, sku, barcode, slug or product_name)" });
      continue;
    }
    const payload = {
      product_id: productId,
      name,
      value: clean(row.value) || null,
      sku: clean(row.variant_sku) || null,
      barcode: clean(row.variant_barcode) || null,
      size: clean(row.size) || null,
      shade: clean(row.shade) || null,
      image_url: clean(row.image_url) || null,
    };

    let existingId: string | null = null;
    if (payload.sku) {
      const { data } = await supabase.from("product_variants").select("id").eq("sku", payload.sku).maybeSingle();
      existingId = data?.id ?? null;
    }
    if (!existingId) {
      let q = supabase.from("product_variants").select("id").eq("product_id", productId).eq("name", name);
      q = payload.value ? q.eq("value", payload.value) : q.is("value", null);
      const { data } = await q.maybeSingle();
      existingId = data?.id ?? null;
    }

    if (existingId) {
      const { error } = await supabase.from("product_variants").update(payload).eq("id", existingId);
      if (error) r.errors.push({ row: i, msg: error.message });
      else r.updated++;
    } else {
      const { error } = await supabase.from("product_variants").insert(payload);
      if (error) r.errors.push({ row: i, msg: error.message });
      else r.created++;
    }
  }
  return r;
}

export const LISTING_TEMPLATE = [
  "sku,product_name,marketplace,external_product_id,product_url,price,mrp,discount_percentage,currency,availability,seller_name,delivery_information,coupon_information,is_active",
  'MIN-VITC-30,Vitamin C 10% Serum,Amazon,B0XXXXXXX,https://www.amazon.in/dp/B0XXXXXXX,499,699,29,INR,in_stock,Cloudtail,Delivery by tomorrow,SAVE10,true',
].join("\n");

export const VARIANT_TEMPLATE = [
  "sku,product_name,variant_name,value,variant_sku,variant_barcode,size,shade,image_url",
  "MIN-VITC-30,Vitamin C 10% Serum,Size,30ml,MIN-VITC-30-30ML,8901234567890,30ml,,https://example.com/img.jpg",
].join("\n");
