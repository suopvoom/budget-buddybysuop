import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bell, Heart, Share2, Sparkles, Star, TrendingDown, Check } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { getProduct } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} · BudgetBuddy` },
          { name: "description", content: loaderData.product.description },
        ]
      : [{ title: "Product · BudgetBuddy" }],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">Product not found.</p>
      <Link to="/" className="text-primary text-sm">Go home</Link>
    </div>
  ),
  errorComponent: () => <div className="p-8 text-center text-sm">Something went wrong.</div>,
});

const ranges = ["30d", "90d", "1y"] as const;

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [range, setRange] = useState<(typeof ranges)[number]>("90d");
  const [tracked, setTracked] = useState(false);

  const points = range === "30d" ? product.history.slice(-30) : product.history;
  const discount = Math.round(((product.mrp - product.currentPrice) / product.mrp) * 100);
  const best = product.listings.slice().sort((a, b) => a.price - b.price)[0];

  const verdict =
    product.currentPrice <= product.avg * 0.95
      ? { label: "Great time to buy", tone: "success" as const, msg: `Below 90-day average of ₹${product.avg}` }
      : product.currentPrice >= product.avg * 1.05
        ? { label: "Wait for a drop", tone: "warn" as const, msg: `Currently above 90-day average of ₹${product.avg}` }
        : { label: "Fair price", tone: "neutral" as const, msg: `Around 90-day average of ₹${product.avg}` };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background pb-32 shadow-[0_0_60px_-20px_rgba(0,0,0,0.15)]">
        {/* Image header */}
        <div className="relative aspect-square bg-secondary">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 top-0 p-4 flex items-center justify-between">
            <Link to="/" className="h-11 w-11 rounded-full bg-background/90 backdrop-blur flex items-center justify-center">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex gap-2">
              <button className="h-11 w-11 rounded-full bg-background/90 backdrop-blur flex items-center justify-center">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="h-11 w-11 rounded-full bg-background/90 backdrop-blur flex items-center justify-center">
                <Heart className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pt-5">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{product.brand}</p>
          <h1 className="font-display text-2xl text-foreground mt-1 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="text-foreground font-medium">{product.rating.toFixed(1)}</span>
              <span>({product.reviews.toLocaleString()})</span>
            </span>
            <span>·</span>
            <span>{product.category}</span>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <span className="font-display text-4xl text-foreground">₹{product.currentPrice}</span>
            <span className="text-sm text-muted-foreground line-through mb-1.5">₹{product.mrp}</span>
            <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-full ml-auto flex items-center gap-1 mb-1">
              <TrendingDown className="h-3 w-3" />
              {discount}% off
            </span>
          </div>

          {/* Buddy AI verdict */}
          <div
            className={cn(
              "mt-4 rounded-2xl p-4 flex gap-3 border",
              verdict.tone === "success" && "bg-success/10 border-success/30",
              verdict.tone === "warn" && "bg-primary/10 border-primary/30",
              verdict.tone === "neutral" && "bg-secondary border-border",
            )}
          >
            <div
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
                verdict.tone === "success" && "bg-success text-success-foreground",
                verdict.tone === "warn" && "bg-primary text-primary-foreground",
                verdict.tone === "neutral" && "bg-foreground text-background",
              )}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Buddy says: {verdict.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{verdict.msg}</p>
            </div>
          </div>

          {/* Price history */}
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg text-foreground">Price history</h2>
              <div className="flex gap-1 bg-secondary p-1 rounded-full">
                {ranges.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full transition",
                      range === r ? "bg-foreground text-background" : "text-muted-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-44 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 10, right: 12, left: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={["dataMin - 30", "dataMax + 30"]} hide />
                  <ReferenceLine y={product.avg} stroke="var(--color-muted-foreground)" strokeDasharray="3 3" opacity={0.4} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-foreground)",
                      color: "var(--color-background)",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--color-background)", opacity: 0.7 }}
                    formatter={(v: number) => [`₹${v}`, "Price"]}
                  />
                  <Area type="monotone" dataKey="price" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#pg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Lowest", value: `₹${product.lowest}`, tone: "text-success" },
                { label: "Average", value: `₹${product.avg}` },
                { label: "Highest", value: `₹${product.highest}`, tone: "text-destructive" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-secondary p-3 text-center">
                  <p className={cn("font-display text-base text-foreground", s.tone)}>{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Compare marketplaces */}
          <section className="mt-6">
            <h2 className="font-display text-lg text-foreground mb-3">Compare across stores</h2>
            <div className="space-y-2">
              {product.listings
                .slice()
                .sort((a, b) => a.price - b.price)
                .map((l) => (
                  <div
                    key={l.marketplace}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition",
                      l === best ? "border-primary/50 bg-primary/5" : "border-border bg-card",
                      !l.inStock && "opacity-50",
                    )}
                  >
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-xs font-semibold text-foreground">
                      {l.marketplace.slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{l.marketplace}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {l.inStock ? "In stock · Free delivery" : "Out of stock"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-base text-foreground">₹{l.price}</p>
                      {l === best && (
                        <p className="text-[10px] text-primary font-semibold uppercase tracking-wide">Best price</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="font-display text-lg text-foreground mb-2">About this product</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </section>
        </div>

        {/* Sticky action bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] p-4 bg-background/95 backdrop-blur-xl border-t border-border/60 flex gap-2">
          <button
            onClick={() => setTracked((t) => !t)}
            className={cn(
              "h-12 px-4 rounded-full flex items-center gap-2 font-medium text-sm border transition",
              tracked
                ? "bg-success/10 border-success/40 text-success"
                : "bg-background border-border text-foreground hover:bg-secondary",
            )}
          >
            {tracked ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {tracked ? "Tracking" : "Track"}
          </button>
          <button className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition">
            Buy at {best.marketplace} · ₹{best.price}
          </button>
        </div>
      </div>
    </div>
  );
}
