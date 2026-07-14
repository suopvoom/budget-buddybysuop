import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Admin" }, { name: "robots", content: "noindex" }] }),
  component: AnalyticsPage,
});

type Ranked = { id: string; name: string; count: number };

function AnalyticsPage() {
  const [viewed, setViewed] = useState<Ranked[]>([]);
  const [saved, setSaved] = useState<Ranked[]>([]);
  const [discounted, setDiscounted] = useState<{ id: string; name: string; pct: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: views }, { data: wl }, { data: prods }] = await Promise.all([
        supabase.from("product_views").select("product_id"),
        supabase.from("wishlist_items").select("product_ref"),
        supabase.from("products").select("id, name, mrp, current_price").limit(500),
      ]);
      const nameMap = new Map((prods ?? []).map((p) => [p.id as string, p.name as string]));

      const vAgg = new Map<string, number>();
      ((views ?? []) as { product_id: string }[]).forEach((v) => vAgg.set(v.product_id, (vAgg.get(v.product_id) ?? 0) + 1));
      setViewed([...vAgg.entries()].map(([id, count]) => ({ id, name: nameMap.get(id) ?? id.slice(0, 8), count }))
        .sort((a, b) => b.count - a.count).slice(0, 10));

      const sAgg = new Map<string, number>();
      ((wl ?? []) as { product_ref: string }[]).forEach((w) => sAgg.set(w.product_ref, (sAgg.get(w.product_ref) ?? 0) + 1));
      setSaved([...sAgg.entries()].map(([id, count]) => ({ id, name: nameMap.get(id) ?? id.slice(0, 8), count }))
        .sort((a, b) => b.count - a.count).slice(0, 10));

      const disc = ((prods ?? []) as { id: string; name: string; mrp: number; current_price: number }[])
        .filter((p) => p.mrp > 0 && p.current_price < p.mrp)
        .map((p) => ({ id: p.id, name: p.name, pct: Math.round(((p.mrp - p.current_price) / p.mrp) * 100) }))
        .sort((a, b) => b.pct - a.pct).slice(0, 10);
      setDiscounted(disc);
    })();
  }, []);

  return (
    <>
      <PageHeader title="Analytics" subtitle="What people view, save, and grab" />
      <div className="p-8 grid grid-cols-3 gap-4">
        <List title="Most viewed" rows={viewed.map((r) => ({ label: r.name, value: `${r.count} views` }))} />
        <List title="Most saved" rows={saved.map((r) => ({ label: r.name, value: `${r.count} lists` }))} />
        <List title="Top discounts" rows={discounted.map((r) => ({ label: r.name, value: `${r.pct}% off` }))} />
      </div>
    </>
  );
}

function List({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <div className="rounded-xl border bg-background">
      <div className="px-4 py-3 border-b"><h2 className="text-sm font-semibold">{title}</h2></div>
      <div className="divide-y">
        {rows.length === 0 && <p className="px-4 py-6 text-xs text-muted-foreground text-center">Not enough data.</p>}
        {rows.map((r, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
            <span className="truncate">{r.label}</span>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
