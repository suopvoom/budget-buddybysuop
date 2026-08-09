import { createFileRoute } from "@tanstack/react-router";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import {
  fetchBrands,
  fetchCategories,
  fetchMarketplaceNames,
  searchProducts,
  type Product,
  type SearchFilters,
} from "@/lib/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search beauty deals · BudgetBuddy" },
      { name: "description", content: "Search real beauty products and compare live marketplace prices tracked by BudgetBuddy." },
      { property: "og:title", content: "Search beauty deals · BudgetBuddy" },
      { property: "og:description", content: "Search the BudgetBuddy catalog by product, brand, category, SKU or barcode." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

const sorts: { key: NonNullable<SearchFilters["sort"]>; label: string }[] = [
  { key: "relevance", label: "Newest" },
  { key: "price_asc", label: "Price ↑" },
  { key: "price_desc", label: "Price ↓" },
  { key: "discount", label: "Discount" },
  { key: "rating", label: "Rating" },
];

function SearchPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [marketplace, setMarketplace] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minDiscount, setMinDiscount] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<NonNullable<SearchFilters["sort"]>>("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<{ name: string; emoji: string }[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchBrands(), fetchMarketplaceNames()]).then(([c, b, m]) => {
      setCats(c);
      setBrands(b);
      setMarkets(m);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      searchProducts({
        query: q,
        category: cat,
        brand,
        marketplace,
        maxPrice,
        minDiscount,
        minRating,
        inStockOnly,
        sort,
      }).then((p) => {
        setProducts(p);
        setLoading(false);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat, brand, marketplace, maxPrice, minDiscount, minRating, inStockOnly, sort]);

  const chip = (active: boolean) =>
    cn(
      "flex-shrink-0 px-4 h-9 rounded-full text-xs font-medium border transition",
      active ? "bg-foreground text-background border-foreground" : "bg-background border-border text-foreground",
    );

  return (
    <AppShell title="Find deals">
      <div className="flex gap-2 mt-2">
        <div className="flex-1 flex items-center gap-2 bg-secondary rounded-2xl px-4 h-12">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, brand, category, SKU or barcode"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          aria-label="Filters"
          className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center",
            showFilters ? "bg-primary text-primary-foreground" : "bg-foreground text-background",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 mt-4 pb-1 scrollbar-none">
        <button onClick={() => setCat(null)} className={chip(cat === null)}>All</button>
        {cats.map((c) => (
          <button key={c.name} onClick={() => setCat(c.name)} className={chip(cat === c.name)}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Marketplace</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setMarketplace(null)} className={chip(marketplace === null)}>Any</button>
              {markets.map((m) => (
                <button key={m} onClick={() => setMarketplace(m)} className={chip(marketplace === m)}>{m}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Brand</p>
            <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto">
              <button onClick={() => setBrand(null)} className={chip(brand === null)}>Any</button>
              {brands.map((b) => (
                <button key={b} onClick={() => setBrand(b)} className={chip(brand === b)}>{b}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Max price</p>
              <input
                type="number"
                value={maxPrice ?? ""}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                placeholder="₹"
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Min discount</p>
              <input
                type="number"
                value={minDiscount ?? ""}
                onChange={(e) => setMinDiscount(e.target.value ? Number(e.target.value) : null)}
                placeholder="%"
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Min rating</p>
              <input
                type="number"
                step="0.1"
                value={minRating ?? ""}
                onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : null)}
                placeholder="4.0"
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              In stock only
            </label>
            <button
              onClick={() => {
                setBrand(null); setMarketplace(null); setMaxPrice(null);
                setMinDiscount(null); setMinRating(null); setInStockOnly(false);
              }}
              className="text-xs text-muted-foreground underline"
            >
              Reset
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {sorts.map((s) => (
              <button key={s.key} onClick={() => setSort(s.key)} className={chip(sort === s.key)}>{s.label}</button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        {loading ? "Searching…" : `${products.length} products from the live catalog`}
      </p>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {!loading && products.length === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-10">
          No products match these filters.
        </p>
      )}
    </AppShell>
  );
}
