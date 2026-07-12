import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, Heart, Share2, Sparkles, Star, TrendingDown, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { fetchProduct, type Product, type Listing } from "@/lib/products";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "Product · BudgetBuddy" }] }),
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
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<(typeof ranges)[number]>("90d");
  const [tracked, setTracked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchProduct(id).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!user || !product) { setTracked(false); return; }
    supabase
      .from("wishlist_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_ref", product.id)
      .maybeSingle()
      .then(({ data }) => setTracked(!!data));
  }, [user, product]);

  async function toggleTrack() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!product) return;
    setBusy(true);
    if (tracked) {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_ref", product.id);
      if (error) toast.error("Couldn't untrack");
      else { setTracked(false); toast.success("Removed from wishlist"); }
    } else {
      const { error } = await supabase.from("wishlist_items").insert({
        user_id: user.id,
        product_ref: product.id,
        target_price: Math.round(product.currentPrice * 0.9),
      });
      if (error) toast.error("Couldn't track");
      else { setTracked(true); toast.success("Tracking — we'll alert you on drops"); }
    }
    setBusy(false);
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!product) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Product not found.</p>
        <Link to="/" className="text-primary text-sm">Go home</Link>
      </div>
    );
  }

  const points = range === "30d" ? product.history.slice(-30) : product.history;
  const discount = Math.round(((product.mrp - product.currentPrice) / product.mrp) * 100);
  const sortedListings = product.listings.slice().sort((a: Listing, b: Listing) => a.price - b.price);
  const best = sortedListings[0];

  const verdict =
    product.currentPrice <= product.avg * 0.95
      ? { label: "Great time to buy", tone: "success" as const, msg: `Below 90-day average of ₹${product.avg}` }
      : product.currentPrice >= product.avg * 1.05
        ? { label: "Wait for a drop", tone: "warn" as const, msg: `Currently above 90-day average of ₹${product.avg}` }
        : { label: "Fair price", tone: "neutral" as const, msg: `Around 90-day average of ₹${product.avg}` };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background pb-32 shadow-[0_0_60px_-20px_rgba(0,0,0,0.15)]">
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
              {points.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No price history yet
                </div>
              ) : (
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
              )}
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

          <section className="mt-6">
            <h2 className="font-display text-lg text-foreground mb-3">Compare across stores</h2>
            <div className="space-y-2">
              {sortedListings.map((l: Listing) => (
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

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] p-4 bg-background/95 backdrop-blur-xl border-t border-border/60 flex gap-2">
          <button
            onClick={toggleTrack}
            disabled={busy}
            className={cn(
              "h-12 px-4 rounded-full flex items-center gap-2 font-medium text-sm border transition disabled:opacity-60",
              tracked
                ? "bg-success/10 border-success/40 text-success"
                : "bg-background border-border text-foreground hover:bg-secondary",
            )}
          >
            {tracked ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {tracked ? "Tracking" : "Track"}
          </button>
          {best && (
            <button className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition">
              Buy at {best.marketplace} · ₹{best.price}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
