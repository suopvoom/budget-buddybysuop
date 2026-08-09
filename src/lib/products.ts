import { supabase } from "@/integrations/supabase/client";

export type Listing = {
  id: string;
  marketplace: string;
  price: number;
  mrp: number | null;
  inStock: boolean;
  availability: string;
  url: string;
  currency: string;
  seller: string | null;
  delivery: string | null;
  couponCode: string | null;
  dataSource: string;
  lastCheckedAt: string | null;
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
  sku: string | null;
  barcode: string | null;
  availability: string;
  lastCheckedAt: string | null;
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

export type HistoryRange = "7d" | "30d" | "90d" | "6m" | "1y";
export const rangeDays: Record<HistoryRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "6m": 182,
  "1y": 365,
};

function deriveTag(discountPct: number, index: number): Product["tag"] {
  if (discountPct >= 40) return "Lowest ever";
  if (discountPct >= 25) return "Deal";
  if (index % 4 === 0) return "Trending";
  if (index % 5 === 0) return "New";
  return undefined;
}

const PRODUCT_SELECT =
  "id, name, description, image_url, current_price, mrp, rating, reviews_count, sku, barcode, stock_status, updated_at, brands(name), categories(name)";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  current_price: number;
  mrp: number;
  rating: number | null;
  reviews_count: number | null;
  sku: string | null;
  barcode: string | null;
  stock_status: string | null;
  brands: { name: string } | null;
  categories: { name: string } | null;
};

type ListingRow = {
  id: string;
  product_id: string;
  price: number;
  mrp: number | null;
  in_stock: boolean;
  availability: string | null;
  url: string | null;
  currency: string | null;
  seller: string | null;
  delivery: string | null;
  coupon_code: string | null;
  data_source: string | null;
  last_checked: string | null;
  marketplaces: { name: string } | null;
};

function toBaseProduct(row: ProductRow, listings: Listing[], index: number): Product {
  const prices = listings.filter((l) => l.inStock).map((l) => l.price);
  const allPrices = prices.length ? prices : listings.map((l) => l.price);
  const lowest = allPrices.length ? Math.min(...allPrices) : Number(row.current_price);
  const highest = allPrices.length ? Math.max(...allPrices) : Number(row.current_price);
  const avg = allPrices.length
    ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length)
    : Number(row.current_price);
  const discount =
    row.mrp > 0 ? Math.round(((Number(row.mrp) - Number(row.current_price)) / Number(row.mrp)) * 100) : 0;
  const lastCheckedAt =
    listings
      .map((l) => l.lastCheckedAt)
      .filter(Boolean)
      .sort()
      .pop() ?? null;
  return {
    id: row.id,
    name: row.name,
    brand: row.brands?.name ?? "",
    category: row.categories?.name ?? "",
    image: row.image_url ?? "",
    currentPrice: allPrices.length ? lowest : Number(row.current_price),
    mrp: Number(row.mrp),
    rating: Number(row.rating ?? 0),
    reviews: row.reviews_count ?? 0,
    description: row.description ?? "",
    lowest,
    highest,
    avg,
    sku: row.sku,
    barcode: row.barcode,
    availability: row.stock_status ?? "unknown",
    lastCheckedAt,
    tag: deriveTag(discount, index),
    listings,
    history: [],
  };
}

function toListing(r: ListingRow): Listing {
  return {
    id: r.id,
    marketplace: r.marketplaces?.name ?? "Store",
    price: Number(r.price),
    mrp: r.mrp === null ? null : Number(r.mrp),
    inStock: r.in_stock,
    availability: r.availability ?? (r.in_stock ? "in_stock" : "out_of_stock"),
    url: r.url ?? "#",
    currency: r.currency ?? "INR",
    seller: r.seller,
    delivery: r.delivery,
    couponCode: r.coupon_code,
    dataSource: r.data_source ?? "manual",
    lastCheckedAt: r.last_checked,
  };
}

async function fetchListingsFor(productIds: string[]): Promise<Map<string, Listing[]>> {
  const map = new Map<string, Listing[]>();
  if (productIds.length === 0) return map;
  const { data } = await supabase
    .from("product_listings")
    .select(
      "id, product_id, price, mrp, in_stock, availability, url, currency, seller, delivery, coupon_code, data_source, last_checked, marketplaces(name)",
    )
    .eq("is_active", true)
    .in("product_id", productIds);
  ((data ?? []) as unknown as ListingRow[]).forEach((r) => {
    const arr = map.get(r.product_id) ?? [];
    arr.push(toListing(r));
    map.set(r.product_id, arr);
  });
  return map;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as unknown as ProductRow[];
  const listingsMap = await fetchListingsFor(rows.map((r) => r.id));
  return rows.map((row, i) => toBaseProduct(row, listingsMap.get(row.id) ?? [], i));
}

export type SearchFilters = {
  query?: string;
  category?: string | null;
  brand?: string | null;
  marketplace?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minDiscount?: number | null;
  minRating?: number | null;
  inStockOnly?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "discount" | "rating";
};

/** Searches the real Supabase catalog: name, brand, category, sku, barcode. */
export async function searchProducts(filters: SearchFilters): Promise<Product[]> {
  const q = (filters.query ?? "").trim();
  let sel = supabase.from("products").select(PRODUCT_SELECT).is("archived_at", null);

  if (q) {
    const esc = q.replace(/[,%()]/g, " ");
    sel = sel.or(`name.ilike.%${esc}%,sku.ilike.%${esc}%,barcode.ilike.%${esc}%`);
  }
  if (filters.minPrice != null) sel = sel.gte("current_price", filters.minPrice);
  if (filters.maxPrice != null) sel = sel.lte("current_price", filters.maxPrice);
  if (filters.minRating != null) sel = sel.gte("rating", filters.minRating);
  if (filters.inStockOnly) sel = sel.eq("stock_status", "in_stock");

  if (filters.sort === "price_asc") sel = sel.order("current_price", { ascending: true });
  else if (filters.sort === "price_desc") sel = sel.order("current_price", { ascending: false });
  else if (filters.sort === "rating") sel = sel.order("rating", { ascending: false });
  else sel = sel.order("created_at", { ascending: false });

  const { data, error } = await sel.limit(200);
  if (error || !data) return [];
  let rows = data as unknown as ProductRow[];

  // Brand / category / free-text-on-brand filtering (joined values).
  if (filters.brand) rows = rows.filter((r) => r.brands?.name === filters.brand);
  if (filters.category) rows = rows.filter((r) => r.categories?.name === filters.category);
  if (q) {
    const ql = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(ql) ||
        (r.brands?.name ?? "").toLowerCase().includes(ql) ||
        (r.categories?.name ?? "").toLowerCase().includes(ql) ||
        (r.sku ?? "").toLowerCase().includes(ql) ||
        (r.barcode ?? "").toLowerCase().includes(ql),
    );
  }

  const listingsMap = await fetchListingsFor(rows.map((r) => r.id));
  let products = rows.map((row, i) => toBaseProduct(row, listingsMap.get(row.id) ?? [], i));

  if (filters.marketplace) {
    products = products.filter((p) => p.listings.some((l) => l.marketplace === filters.marketplace));
  }
  if (filters.minDiscount != null) {
    products = products.filter(
      (p) => p.mrp > 0 && ((p.mrp - p.currentPrice) / p.mrp) * 100 >= filters.minDiscount!,
    );
  }
  if (filters.sort === "discount") {
    products.sort((a, b) => {
      const da = a.mrp > 0 ? (a.mrp - a.currentPrice) / a.mrp : 0;
      const db = b.mrp > 0 ? (b.mrp - b.currentPrice) / b.mrp : 0;
      return db - da;
    });
  }
  return products;
}

export async function fetchProduct(id: string, range: HistoryRange = "90d"): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as ProductRow;
  const listingsMap = await fetchListingsFor([row.id]);
  const base = toBaseProduct(row, listingsMap.get(row.id) ?? [], 0);

  const since = new Date(Date.now() - rangeDays[range] * 86400000).toISOString();
  const { data: hist } = await supabase
    .from("price_history")
    .select("price, recorded_at")
    .eq("product_id", row.id)
    .gte("recorded_at", since)
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

export async function fetchBrands(): Promise<string[]> {
  const { data } = await supabase.from("brands").select("name").order("name");
  return (data ?? []).map((b) => b.name as string);
}

export async function fetchMarketplaceNames(): Promise<string[]> {
  const { data } = await supabase.from("marketplaces").select("name").order("name");
  return (data ?? []).map((m) => m.name as string);
}

/** Human freshness label built from last_checked_at — never claims real-time. */
export function freshness(iso: string | null): { label: string; stale: boolean } {
  if (!iso) return { label: "No sync recorded", stale: true };
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  const stale = mins > 60 * 24;
  if (mins < 1) return { label: "Updated just now", stale };
  if (mins < 60) return { label: `Updated ${mins} min ago`, stale };
  const h = Math.round(mins / 60);
  if (h < 24) return { label: `Updated ${h} h ago`, stale };
  return { label: `Updated ${Math.round(h / 24)} d ago`, stale: true };
}
