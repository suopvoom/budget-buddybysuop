import { supabase } from "@/integrations/supabase/client";

export type Listing = {
  marketplace: string;
  price: number;
  inStock: boolean;
  url: string;
};

export type PricePoint = { date: string; price: number };

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  currentPrice: number;
  mrp: number;
  rating: number;
  reviews: number;
  description: string;
  lowest: number;
  highest: number;
  avg: number;
  tag?: "Deal" | "Lowest ever" | "New" | "Trending";
  listings: Listing[];
  history: PricePoint[];
};

export const categoryEmoji: Record<string, string> = {
  Skincare: "🧴",
  Makeup: "💄",
  Haircare: "💇",
  Fragrance: "🌸",
  Body: "🧖",
  Wellness: "🌿",
};

function deriveTag(discountPct: number, index: number): Product["tag"] {
  if (discountPct >= 40) return "Lowest ever";
  if (discountPct >= 25) return "Deal";
  if (index % 4 === 0) return "Trending";
  if (index % 5 === 0) return "New";
  return undefined;
}

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  current_price: number;
  mrp: number;
  rating: number | null;
  reviews_count: number | null;
  brands: { name: string } | null;
  categories: { name: string } | null;
};

type ListingRow = {
  product_id: string;
  price: number;
  in_stock: boolean;
  url: string | null;
  marketplaces: { name: string } | null;
};

function toBaseProduct(row: ProductRow, listings: Listing[], index: number): Product {
  const prices = listings.map((l) => l.price);
  const lowest = prices.length ? Math.min(...prices) : Number(row.current_price);
  const highest = prices.length ? Math.max(...prices) : Number(row.current_price);
  const avg = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : Number(row.current_price);
  const discount = row.mrp > 0 ? Math.round(((Number(row.mrp) - Number(row.current_price)) / Number(row.mrp)) * 100) : 0;
  return {
    id: row.id,
    name: row.name,
    brand: row.brands?.name ?? "",
    category: row.categories?.name ?? "",
    image: row.image_url ?? "",
    currentPrice: Number(row.current_price),
    mrp: Number(row.mrp),
    rating: Number(row.rating ?? 4.3),
    reviews: row.reviews_count ?? 0,
    description: row.description ?? "",
    lowest,
    highest,
    avg,
    tag: deriveTag(discount, index),
    listings,
    history: [],
  };
}

async function fetchListingsFor(productIds: string[]): Promise<Map<string, Listing[]>> {
  const map = new Map<string, Listing[]>();
  if (productIds.length === 0) return map;
  const { data } = await supabase
    .from("product_listings")
    .select("product_id, price, in_stock, url, marketplaces(name)")
    .in("product_id", productIds);
  ((data ?? []) as unknown as ListingRow[]).forEach((r) => {
    const arr = map.get(r.product_id) ?? [];
    arr.push({
      marketplace: r.marketplaces?.name ?? "Store",
      price: Number(r.price),
      inStock: r.in_stock,
      url: r.url ?? "#",
    });
    map.set(r.product_id, arr);
  });
  return map;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, image_url, current_price, mrp, rating, reviews_count, brands(name), categories(name)")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as unknown as ProductRow[];
  const listingsMap = await fetchListingsFor(rows.map((r) => r.id));
  return rows.map((row, i) => toBaseProduct(row, listingsMap.get(row.id) ?? [], i));
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, image_url, current_price, mrp, rating, reviews_count, brands(name), categories(name)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as ProductRow;
  const listingsMap = await fetchListingsFor([row.id]);
  const base = toBaseProduct(row, listingsMap.get(row.id) ?? [], 0);

  const { data: hist } = await supabase
    .from("price_history")
    .select("price, recorded_at")
    .eq("product_id", row.id)
    .order("recorded_at", { ascending: true });
  const history: PricePoint[] = (hist ?? []).map((h) => ({
    date: new Date(h.recorded_at as string).toISOString().slice(0, 10),
    price: Number(h.price),
  }));
  if (history.length > 0) {
    const prices = history.map((h) => h.price);
    base.history = history;
    base.lowest = Math.min(...prices);
    base.highest = Math.max(...prices);
    base.avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  }
  return base;
}

export async function fetchCategories(): Promise<{ name: string; emoji: string }[]> {
  const { data } = await supabase.from("categories").select("name").order("name");
  return (data ?? []).map((c) => ({
    name: c.name as string,
    emoji: categoryEmoji[c.name as string] ?? "✨",
  }));
}
