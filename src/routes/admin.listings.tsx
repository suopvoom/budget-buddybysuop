import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { detectMarketplaceFromUrl, normalizeProductUrl } from "@/lib/marketplace/types";

export const Route = createFileRoute("/admin/listings")({
  head: () => ({ meta: [{ title: "Marketplace Listings · Admin" }, { name: "robots", content: "noindex" }] }),
  component: ListingsPage,
});

type Row = {
  id: string;
  product_id: string;
  marketplace_id: string;
  external_product_id: string | null;
  url: string | null;
  normalized_url: string | null;
  price: number;
  mrp: number | null;
  discount_pct: number | null;
  currency: string;
  availability: string;
  in_stock: boolean;
  seller: string | null;
  delivery: string | null;
  coupon_code: string | null;
  data_source: string;
  is_active: boolean;
  last_checked: string;
  last_synced_at: string | null;
  last_error: string | null;
  products: { name: string } | null;
  marketplaces: { name: string; slug: string } | null;
};

const SELECT =
  "id, product_id, marketplace_id, external_product_id, url, normalized_url, price, mrp, discount_pct, currency, availability, in_stock, seller, delivery, coupon_code, data_source, is_active, last_checked, last_synced_at, last_error, products(name), marketplaces(name, slug)";

function ago(iso: string | null) {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

function ListingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});

  // Add-by-URL form
  const [url, setUrl] = useState("");
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [markets, setMarkets] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [l, p, m] = await Promise.all([
      supabase.from("product_listings").select(SELECT).order("last_checked", { ascending: false }).limit(300),
      supabase.from("products").select("id, name").order("name").limit(500),
      supabase.from("marketplaces").select("id, name, slug").order("name"),
    ]);
    setRows((l.data ?? []) as unknown as Row[]);
    setProducts((p.data ?? []) as { id: string; name: string }[]);
    setMarkets((m.data ?? []) as { id: string; name: string; slug: string }[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        q === "" ||
        (r.products?.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (r.marketplaces?.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (r.external_product_id ?? "").toLowerCase().includes(q.toLowerCase()),
      ),
    [rows, q],
  );

  async function addFromUrl() {
    if (!url.trim() || !productId) { toast.error("Pick a product and paste a listing URL"); return; }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) { toast.error("Enter the listed price"); return; }
    const slug = detectMarketplaceFromUrl(url);
    const market = markets.find((m) => m.slug === slug);
    if (!market) { toast.error("URL does not match a configured marketplace"); return; }
    const normalized = normalizeProductUrl(url);

    setSaving(true);
    // Duplicate detection: same normalized URL, or same product on same store.
    const { data: dupe } = await supabase
      .from("product_listings")
      .select("id")
      .eq("marketplace_id", market.id)
      .or(`normalized_url.eq.${normalized},product_id.eq.${productId}`)
      .maybeSingle();
    if (dupe) {
      setSaving(false);
      toast.error("A listing for this product on this marketplace already exists");
      return;
    }

    const now = new Date().toISOString();
    const { data: created, error } = await supabase
      .from("product_listings")
      .insert({
        product_id: productId,
        marketplace_id: market.id,
        url: url.trim(),
        normalized_url: normalized,
        price: priceNum,
        data_source: "manual",
        availability: "in_stock",
        in_stock: true,
        last_checked: now,
      })
      .select("id")
      .single();
    if (error) { setSaving(false); toast.error(error.message); return; }

    await supabase.from("price_history").insert({
      product_id: productId,
      marketplace_id: market.id,
      product_marketplace_id: created!.id,
      price: priceNum,
      source: "manual",
    });
    await logAudit("create_listing", "product_listings", created!.id, { url: normalized, price: priceNum });
    toast.success("Listing added");
    setUrl(""); setPrice(""); setProductId("");
    setSaving(false);
    load();
  }

  async function recordPrice(r: Row) {
    const raw = prices[r.id];
    const p = Number(raw);
    if (!raw || !Number.isFinite(p) || p <= 0) { toast.error("Enter a valid price"); return; }
    const now = new Date().toISOString();
    const { error } = await supabase.from("price_history").insert({
      product_id: r.product_id,
      marketplace_id: r.marketplace_id,
      product_marketplace_id: r.id,
      price: p,
      mrp: r.mrp,
      source: "manual",
      availability: r.availability,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("product_listings").update({ price: p, last_checked: now }).eq("id", r.id);
    await logAudit("record_price", "product_listings", r.id, { price: p });
    setPrices({ ...prices, [r.id]: "" });
    toast.success("Price recorded — alerts will fan out");
    load();
  }

  async function toggleActive(r: Row) {
    await supabase.from("product_listings").update({ is_active: !r.is_active }).eq("id", r.id);
    await logAudit(r.is_active ? "disable_listing" : "enable_listing", "product_listings", r.id, null);
    load();
  }

  return (
    <>
      <PageHeader title="Marketplace Listings" subtitle="One product, many marketplaces. Every price change writes a price_history record." />
      <div className="p-8 space-y-8">
        <section className="rounded-xl border bg-background p-5">
          <h2 className="text-sm font-semibold mb-3">Add listing from a permitted product URL</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Input placeholder="https://www.nykaa.com/…" value={url} onChange={(e) => setUrl(e.target.value)} className="md:col-span-2 h-9" />
            <div className="flex gap-2">
              <Input placeholder="Price ₹" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-9" />
              <Button size="sm" disabled={saving} onClick={addFromUrl}>Add</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Detected marketplace: {detectMarketplaceFromUrl(url) ?? "—"}. URLs are normalized (tracking params stripped) for duplicate detection.
          </p>
        </section>

        <div className="flex items-center gap-2">
          <Input placeholder="Search product, marketplace or external id…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 max-w-sm" />
          <span className="text-xs text-muted-foreground">{filtered.length} listings</span>
        </div>

        <div className="rounded-xl border bg-background overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Marketplace</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Availability</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Last checked</th>
                <th className="text-left px-4 py-3">Last error</th>
                <th className="px-4 py-3 w-56">Record price</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">No listings.</td></tr>}
              {filtered.map((r) => (
                <tr key={r.id} className={r.is_active ? "" : "opacity-50"}>
                  <td className="px-4 py-3">{r.products?.name ?? "—"}</td>
                  <td className="px-4 py-3">{r.marketplaces?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.currency === "INR" ? "₹" : ""}{Number(r.price).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">{r.availability}</td>
                  <td className="px-4 py-3 text-xs">{r.data_source}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{ago(r.last_checked)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{r.last_error ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Input type="number" placeholder="₹" value={prices[r.id] ?? ""} onChange={(e) => setPrices({ ...prices, [r.id]: e.target.value })} className="h-8" />
                      <Button size="sm" onClick={() => recordPrice(r)}>Save</Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(r)}>
                      {r.is_active ? "Disable" : "Enable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
