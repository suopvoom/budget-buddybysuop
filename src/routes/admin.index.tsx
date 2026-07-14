import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Package, Tag, Grid3x3, ShoppingBag, Ticket, TrendingDown, Bell, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard · Admin" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

type Kpi = { label: string; value: string | number; icon: typeof Package; href: string; hint?: string };

function DashboardPage() {
  const [stats, setStats] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<{ id: string; action: string; entity: string; created_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const counts = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }).not("archived_at", "is", null),
        supabase.from("brands").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("marketplaces").select("*", { count: "exact", head: true }),
        supabase.from("coupons").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("wishlist_items").select("*", { count: "exact", head: true }),
        supabase.from("price_alerts").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("notifications").select("*", { count: "exact", head: true }),
      ]);
      const [total, archived, brands, cats, mkt, coupons, tracked, alerts, notifs] = counts.map((c) => c.count ?? 0);
      setStats([
        { label: "Total products", value: total, icon: Package, href: "/admin/products", hint: `${archived} archived` },
        { label: "Brands", value: brands, icon: Tag, href: "/admin/brands" },
        { label: "Categories", value: cats, icon: Grid3x3, href: "/admin/categories" },
        { label: "Marketplaces", value: mkt, icon: ShoppingBag, href: "/admin/marketplaces" },
        { label: "Active coupons", value: coupons, icon: Ticket, href: "/admin/coupons" },
        { label: "Tracked items", value: tracked, icon: TrendingDown, href: "/admin/price-tracking", hint: `${alerts} alerts armed` },
        { label: "Notifications sent", value: notifs, icon: Bell, href: "/admin/notifications" },
        { label: "Users", value: "—", icon: Users, href: "/admin/users" },
      ]);

      const { data: logs } = await supabase
        .from("audit_logs")
        .select("id, action, entity, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setActivity(logs ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Everything happening across BudgetBuddy" />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                to={s.href as never}
                className="rounded-xl border bg-background p-5 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{loading ? "…" : s.value}</p>
                {s.hint && <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>}
              </Link>
            );
          })}
        </div>

        <div className="rounded-xl border bg-background">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold">Recent activity</h2>
          </div>
          <div className="divide-y">
            {activity.length === 0 && (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No activity yet.</p>
            )}
            {activity.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <span>
                  <span className="font-medium">{a.action}</span>{" "}
                  <span className="text-muted-foreground">on {a.entity}</span>
                </span>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
