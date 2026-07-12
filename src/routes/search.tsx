import { createFileRoute } from "@tanstack/react-router";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import { fetchProducts, fetchCategories, type Product } from "@/lib/products";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search · BudgetBuddy" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<{ name: string; emoji: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).then(([p, c]) => {
      setProducts(p);
      setCats(c);
      setLoading(false);
    });
  }, []);

  const filtered = products.filter(
    (p) =>
      (!cat || p.category === cat) &&
      (q === "" ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.brand.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <AppShell title="Find deals">
      <div className="flex gap-2 mt-2">
        <div className="flex-1 flex items-center gap-2 bg-secondary rounded-2xl px-4 h-12">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Serum, lipstick, shampoo…"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 mt-4 pb-1 scrollbar-none">
        <button
          onClick={() => setCat(null)}
          className={`flex-shrink-0 px-4 h-9 rounded-full text-xs font-medium border transition ${
            cat === null ? "bg-foreground text-background border-foreground" : "bg-background border-border text-foreground"
          }`}
        >
          All
        </button>
        {cats.map((c) => (
          <button
            key={c.name}
            onClick={() => setCat(c.name)}
            className={`flex-shrink-0 px-4 h-9 rounded-full text-xs font-medium border transition ${
              cat === c.name ? "bg-foreground text-background border-foreground" : "bg-background border-border text-foreground"
            }`}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        {loading ? "Loading…" : `${filtered.length} products · sorted by best deal`}
      </p>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </AppShell>
  );
}
