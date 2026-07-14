import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Tag, Grid3x3, ShoppingBag, Ticket, Bell, Users,
  TrendingDown, BarChart3, Upload, ClipboardList, LogOut, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoles } from "@/hooks/use-role";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/brands", label: "Brands", icon: Tag },
  { to: "/admin/categories", label: "Categories", icon: Grid3x3 },
  { to: "/admin/marketplaces", label: "Marketplaces", icon: ShoppingBag },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/price-tracking", label: "Price Tracking", icon: TrendingDown },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/import-export", label: "Import / Export", icon: Upload },
  { to: "/admin/audit", label: "Audit Logs", icon: ClipboardList },
];

export function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { canManage, isAdmin, highest, loading, user } = useRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!canManage) navigate({ to: "/" });
  }, [loading, user, canManage, navigate]);

  if (loading || !user || !canManage) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading admin…</div>;
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-60 border-r bg-background flex flex-col">
        <div className="h-16 px-5 flex items-center gap-2 border-b">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">BudgetBuddy</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Admin · {highest}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            if (n.to === "/admin/users" && !isAdmin) return null;
            if (n.to === "/admin/audit" && !isAdmin) return null;
            return (
              <Link
                key={n.to}
                to={n.to as string}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition",
                  active ? "bg-primary text-primary-foreground font-medium" : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted">
            <LayoutDashboard className="h-4 w-4" /> Back to app
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted text-left"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
