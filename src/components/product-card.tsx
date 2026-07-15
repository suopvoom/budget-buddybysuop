import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const discount =
    product.mrp > 0 ? Math.round(((product.mrp - product.currentPrice) / product.mrp) * 100) : 0;
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {discount >= 15 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
            −{discount}%
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
          }}
          aria-label="Save"
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition hover:bg-background"
        >
          <Heart className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
      <div className="pt-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {product.brand || "\u00A0"}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
          {product.name}
        </h3>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="tabular text-[15px] font-semibold text-foreground">
            ₹{product.currentPrice.toLocaleString()}
          </span>
          {product.mrp > product.currentPrice && (
            <span className="tabular text-[11px] text-muted-foreground line-through">
              ₹{product.mrp.toLocaleString()}
            </span>
          )}
        </div>
        {product.listings.length > 0 && (
          <p className={cn("mt-0.5 text-[10px] text-muted-foreground")}>
            {product.listings.length} store{product.listings.length > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
