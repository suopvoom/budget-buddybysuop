import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/admin/price-tracking")({
  head: () => ({ meta: [{ title: "Price Tracking · Admin" }, { name: "robots", content: "noindex" }] }),
  component: PriceTrackingPage,
});

type Listing = {
  id: string;
  product_id: string;
  price: number;
  in_stock: boolean;
  last_checked: string;
  products: { name: string } | null;
  marketplaces: { name: string } | null;
};

function PriceTrackingPage() {
  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("product_listings")
      .select("id, product_id, price, in_stock, last_checked, products(name), marketplaces(name)")
      .order("last_checked", { ascending: false })
      .limit(200);
    setRows((data ?? []) as unknown as Listing[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function record(l: Listing) {
    const raw = prices[l.id];
    const newPrice = Number(raw);
    if (!raw || !Number.isFinite(newPrice) || newPrice <= 0) { toast.error("Enter a valid price"); return; }
    const { error } = await supabase.from("price_history").insert({
      product_id: l.product_id, marketplace_id: (l as unknown as { marketplace_id?: string }).marketplace_id ?? null, price: newPrice,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("product_listings").update({ price: newPrice, last_checked: new Date().toISOString() }).eq("id", l.id);
    await logAudit("record_price", "product_listings", l.id, { price: newPrice });
    toast.success("Recorded — trigger will fan out alerts");
    setPrices({ ...prices, [l.id]: "" });
    load();
  }

  return (
    <>
      <PageHeader title="Price Tracking" subtitle="Record new prices to trigger alerts and history" />
      <div className="p-8">
        <div className="rounded-xl border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Marketplace</th>
                <th className="text-right px-4 py-3">Current</th>
                <th className="text-left px-4 py-3">Last checked</th>
                <th className="px-4 py-3 w-64">Record new</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No listings.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.products?.name ?? "—"}</td>
                  <td className="px-4 py-3">{r.marketplaces?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{Number(r.price).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.last_checked).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Input type="number" placeholder="₹" value={prices[r.id] ?? ""} onChange={(e) => setPrices({ ...prices, [r.id]: e.target.value })} className="h-8" />
                      <Button size="sm" onClick={() => record(r)}>Save</Button>
                    </div>
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
