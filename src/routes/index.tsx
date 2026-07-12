import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import { fetchProducts, fetchCategories, type Product } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BudgetBuddy — Never pay full price again" },
      { name: "description", content: "Track prices, spot real deals, and shop smarter across beauty & personal care." },
      { property: "og:title", content: "BudgetBuddy — Smart shopping companion" },
      { property: "og:description", content: "Track prices, spot real deals, and shop smarter." },
    ],
  }),
  component: Home,
});

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<{ name: string; emoji: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const totalSaved = 2847;

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).then(([p, c]) => {
      setProducts(p);
      setCats(c);
      setLoading(false);
    });
  }, []);

  const trending = products.slice(0, 4);
  const deals = products.filter((p) => p.tag === "Deal" || p.tag === "Lowest ever");

  return (
    <AppShell title="Hey, Aisha 👋">
      <div className="mt-2 rounded-3xl p-5 bg-gradient-to-br from-foreground to-foreground/85 text-background relative overflow-hidden">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/30 blur-2xl" />
        <div className="absolute -right-2 bottom-0 h-24 w-24 rounded-full bg-accent/30 blur-2xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest opacity-70">You've saved this month</p>
          <p className="font-display text-4xl mt-1">₹{totalSaved.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-3 text-xs opacity-80">
            <TrendingDown className="h-3.5 w-3.5" /> 12 price drops caught for you
          </div>
        </div>
      </div>

      <button className="mt-4 w-full flex items-center justify-between p-4 rounded-2xl bg-accent/15 border border-accent/30 hover:bg-accent/20 transition">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Ask Buddy AI</p>
            <p className="text-xs text-muted-foreground">"Should I buy this now?"</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-foreground" />
      </button>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-foreground">Categories</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-1 scrollbar-none">
          {cats.map((c) => (
            <Link
              key={c.name}
              to="/search"
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
            >
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-2xl group-hover:bg-primary/10 group-hover:scale-105 transition">
                {c.emoji}
              </div>
              <span className="text-[11px] font-medium text-foreground">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg text-foreground">Price drops today</h2>
            <p className="text-xs text-muted-foreground">Hand-picked from your interests</p>
          </div>
          <Link to="/search" className="text-xs font-medium text-primary flex items-center gap-1">
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading deals…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(deals.length ? deals : trending).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg text-foreground mb-3">Trending in Beauty</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
