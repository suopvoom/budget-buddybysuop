import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SimpleCrud } from "@/components/admin/simple-crud";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons · Admin" }, { name: "robots", content: "noindex" }] }),
  component: CouponsPage,
});

function CouponsPage() {
  const [markets, setMarkets] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => { supabase.from("marketplaces").select("id, name").order("name").then(({ data }) => setMarkets(data ?? [])); }, []);
  return (
    <SimpleCrud
      title="Coupons"
      table="coupons"
      orderBy="created_at"
      initial={{ active: true }}
      fields={[
        { key: "code", label: "Code", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "marketplace_id", label: "Marketplace", type: "select", options: markets.map((m) => ({ value: m.id, label: m.name })) },
        { key: "discount_pct", label: "Discount %", type: "number" },
        { key: "discount_amount", label: "Discount ₹", type: "number" },
        { key: "min_order", label: "Min order ₹", type: "number" },
        { key: "expires_at", label: "Expires", type: "date" },
        { key: "active", label: "Active", type: "checkbox" },
      ]}
      columns={[
        { key: "code", label: "Code" },
        { key: "discount_pct", label: "%", render: (r: { discount_pct: number | null }) => r.discount_pct ? `${r.discount_pct}%` : "—" },
        { key: "discount_amount", label: "₹", render: (r: { discount_amount: number | null }) => r.discount_amount ? `₹${r.discount_amount}` : "—" },
        { key: "expires_at", label: "Expires", render: (r: { expires_at: string | null }) => r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—" },
        { key: "active", label: "Active", render: (r: { active: boolean }) => r.active ? "Yes" : "No" },
      ]}
    />
  );
}
