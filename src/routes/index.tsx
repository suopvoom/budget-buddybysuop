import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Search as SearchIcon,
  Droplet,
  Palette,
  Scissors,
  Flower2,
  Sparkle,
  Leaf,
  Package,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import { fetchProducts, fetchCategories, type Product } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BudgetBuddy — Never pay full price again" },
      { name: "description", content: "Track prices, spot real deals, and shop smarter across beauty & personal care." },
      { property: "og:title", content: "BudgetBuddy — Never pay full price again" },
      { property: "og:description", content: "Track prices, spot real deals, and shop smarter across beauty & personal care." },
    ],
  }),
  component: Home,
});

const categoryIcon: Record<string, typeof Droplet> = {
  Skincare: Droplet,
  Makeup: Palette,
  Haircare: Scissors,
  Fragrance: Flower2,
  Body: Sparkle,
  Wellness: Leaf,
};

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const step = w / (values.length - 1);
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savings, setSavings] = useState<{ total: number; count: number; series: number[] } | null>(null);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).then(([p, c]) => {
      setProducts(p);
      setCats(c);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setSavings(null);
      return;
    }
    (async () => {
      // Derive real savings from wishlist items where current price < mrp
      const { data: items } = await supabase
        .from("wishlist_items")
        .select("product_ref, products(current_price, mrp)")
        .eq("user_id", user.id);
      type Row = { products: { current_price: number; mrp: number } | null };
      const rows = (items ?? []) as unknown as Row[];
      let total = 0;
      let count = 0;
      const series: number[] = [];
      rows.forEach((r) => {
        if (!r.products) return;
        const diff = Number(r.products.mrp) - Number(r.products.current_price);
        if (diff > 0) {
          total += diff;
          count += 1;
          series.push(diff);
        }
      });
      setSavings({ total: Math.round(total), count, series: series.slice(-14) });
    })();
  }, [user]);

  const trending = useMemo(() => products.slice(0, 6), [products]);
  const deals = useMemo(
    () =>
      products
        .filter((p) => p.mrp > p.currentPrice)
        .sort((a, b) => (b.mrp - b.currentPrice) / b.mrp - (a.mrp - a.currentPrice) / a.mrp)
        .slice(0, 6),
    [products],
  );

  return (
    <AppShell>
      {/* Savings hero */}
      <section className="mt-1 rounded-3xl bg-[oklch(0.22_0.04_260)] p-5 text-background">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-background/60 font-semibold">
              Saved this month
            </p>
            {savings && savings.total > 0 ? (
              <>
                <p className="mt-2 font-display text-[40px] leading-none tracking-tight tabular">
                  ₹{savings.total.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-background/70">
                  {savings.count} price {savings.count === 1 ? "drop" : "drops"} caught for you
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 font-display text-[28px] leading-tight tracking-tight">
                  Start tracking to see savings
                </p>
                <p className="mt-1.5 text-xs text-background/70">
                  Tap Save on any product — we'll do the math.
                </p>
              </>
            )}
          </div>
          {savings && savings.series.length > 1 && (
            <div className="text-primary shrink-0 mt-1">
              <Sparkline values={savings.series} />
            </div>
          )}
        </div>
      </section>

      {/* Search trigger */}
      <Link
        to="/search"
        className="mt-4 flex items-center gap-3 rounded-full border border-border/80 bg-card px-4 py-3 text-sm text-muted-foreground transition hover:bg-secondary"
      >
        <SearchIcon className="h-4 w-4" strokeWidth={1.75} />
        <span className="flex-1">Search products, brands or stores</span>
      </Link>

      {/* Categories */}
      <section className="mt-7">
        <SectionHeader title="Categories" subtitle="Browse by what you love" />
        <div className="mt-3 -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 scrollbar-none">
          {cats.map((c) => {
            const Icon = categoryIcon[c.name] ?? Package;
            return (
              <Link
                key={c.name}
                to="/search"
                className="group flex shrink-0 flex-col items-center gap-2"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border/80 bg-card text-foreground transition group-hover:border-foreground/30 group-hover:bg-secondary">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                </div>
                <span className="text-[11px] font-medium text-foreground">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Price drops */}
      <section className="mt-8">
        <SectionHeader
          title="Price drops today"
          subtitle="Hand-picked from your interests"
          href="/search"
        />
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6">
            {(deals.length ? deals : trending).slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Trending */}
      <section className="mt-8">
        <SectionHeader
          title="Trending now"
          subtitle="What shoppers are watching this week"
          href="/search"
        />
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6">
            {trending.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-[19px] leading-tight tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link
          to={href}
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-foreground/80 hover:text-foreground"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
