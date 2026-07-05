import { createFileRoute } from "@tanstack/react-router";
import { Bell, TrendingDown } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { products } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist · BudgetBuddy" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const items = products.slice(0, 5);
  return (
    <AppShell title="Your wishlist">
      <p className="text-sm text-muted-foreground mt-1">We'll ping you the moment prices drop.</p>

      <div className="mt-5 space-y-3">
        {items.map((p) => {
          const drop = Math.round(((p.mrp - p.currentPrice) / p.mrp) * 100);
          const target = Math.round(p.currentPrice * 0.9);
          return (
            <Link
              key={p.id}
              to="/product/$id"
              params={{ id: p.id }}
              className="flex gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition"
            >
              <img src={p.image} alt={p.name} className="h-24 w-24 rounded-xl object-cover bg-secondary" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{p.brand}</p>
                <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{p.name}</h3>
                <div className="flex items-end gap-1.5 mt-1">
                  <span className="font-display text-base text-foreground">₹{p.currentPrice}</span>
                  <span className="text-xs text-muted-foreground line-through">₹{p.mrp}</span>
                  <span className="text-[11px] text-success font-semibold ml-auto flex items-center gap-0.5">
                    <TrendingDown className="h-3 w-3" />
                    {drop}%
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Bell className="h-3 w-3 text-primary" />
                  Alert at ₹{target}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
