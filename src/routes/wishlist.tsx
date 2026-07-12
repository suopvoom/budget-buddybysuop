import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, TrendingDown, Heart, LogIn, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { fetchProduct, type Product } from "@/lib/products";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist · BudgetBuddy" }] }),
  component: WishlistPage,
});

type Item = { id: string; product_ref: string; target_price: number | null; product: Product | null };

function WishlistPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) { setFetching(false); return; }
    (async () => {
      setFetching(true);
      const { data } = await supabase
        .from("wishlist_items")
        .select("id, product_ref, target_price")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const rows = data ?? [];
      const products = await Promise.all(rows.map((r) => fetchProduct(r.product_ref as string)));
      setItems(rows.map((r, i) => ({
        id: r.id as string,
        product_ref: r.product_ref as string,
        target_price: r.target_price as number | null,
        product: products[i],
      })));
      setFetching(false);
    })();
  }, [user]);

  async function remove(id: string) {
    const prev = items;
    setItems(items.filter((i) => i.id !== id));
    const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
    if (error) { setItems(prev); toast.error("Couldn't remove item"); }
  }

  if (loading || fetching) {
    return <AppShell title="Your wishlist"><p className="mt-4 text-sm text-muted-foreground">Loading…</p></AppShell>;
  }

  if (!user) {
    return (
      <AppShell title="Your wishlist">
        <div className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 text-center">
          <div className="h-14 w-14 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl text-foreground mt-4">Sign in to save products</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your wishlist syncs across devices and unlocks price alerts.
          </p>
          <Link to="/auth" className="mt-5 inline-flex h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm items-center gap-2">
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  if (items.length === 0) {
    return (
      <AppShell title="Your wishlist">
        <div className="mt-10 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
            <Heart className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-foreground font-medium">No tracked items yet</p>
          <p className="text-xs text-muted-foreground mt-1">Tap "Track" on any product to add it here.</p>
          <Link to="/search" className="mt-5 inline-flex h-10 px-5 rounded-full bg-foreground text-background font-semibold text-xs items-center">
            Browse products
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Your wishlist">
      <p className="text-sm text-muted-foreground mt-1">We'll ping you the moment prices drop.</p>
      <div className="mt-5 space-y-3">
        {items.map((it) => {
          const p = it.product;
          if (!p) return null;
          const drop = Math.round(((p.mrp - p.currentPrice) / p.mrp) * 100);
          const target = it.target_price ?? Math.round(p.currentPrice * 0.9);
          return (
            <div key={it.id} className="relative flex gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition">
              <button
                onClick={() => remove(it.id)}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/90 flex items-center justify-center text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <Link to="/product/$id" params={{ id: p.id }} className="flex gap-3 flex-1 min-w-0">
                <img src={p.image} alt={p.name} className="h-24 w-24 rounded-xl object-cover bg-secondary" />
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{p.brand}</p>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{p.name}</h3>
                  <div className="flex items-end gap-1.5 mt-1">
                    <span className="font-display text-base text-foreground">₹{p.currentPrice}</span>
                    <span className="text-xs text-muted-foreground line-through">₹{p.mrp}</span>
                    <span className="text-[11px] text-success font-semibold ml-auto flex items-center gap-0.5">
                      <TrendingDown className="h-3 w-3" />{drop}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Bell className="h-3 w-3 text-primary" /> Alert at ₹{target}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
