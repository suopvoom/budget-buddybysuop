import { Link } from "@tanstack/react-router";
import { TrendingDown, Heart } from "lucide-react";
import type { Product } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const discount = Math.round(((product.mrp - product.currentPrice) / product.mrp) * 100);
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block bg-card rounded-3xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all"
    >
      <div className="relative aspect-square bg-secondary overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.tag && (
          <span
            className={cn(
              "absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide",
              product.tag === "Lowest ever" && "bg-success text-success-foreground",
              product.tag === "Deal" && "bg-primary text-primary-foreground",
              product.tag === "Trending" && "bg-accent text-accent-foreground",
              product.tag === "New" && "bg-foreground text-background",
            )}
          >
            {product.tag}
          </span>
        )}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background"
        >
          <Heart className="h-4 w-4 text-foreground" />
        </button>
      </div>
      <div className="p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{product.brand}</p>
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mt-0.5 leading-snug">{product.name}</h3>
        <div className="mt-2 flex items-end gap-1.5">
          <span className="font-display text-lg text-foreground">₹{product.currentPrice}</span>
          <span className="text-xs text-muted-foreground line-through mb-0.5">₹{product.mrp}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-success font-medium">
          <TrendingDown className="h-3 w-3" />
          {discount}% off · lowest ₹{product.lowest}
        </div>
      </div>
    </Link>
  );
}
