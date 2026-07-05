export type Marketplace = "Nykaa" | "Amazon" | "Myntra" | "Tira" | "Purplle";

export type Listing = {
  marketplace: Marketplace;
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
  lowest: number;
  highest: number;
  avg: number;
  tag?: "Deal" | "Lowest ever" | "New" | "Trending";
  listings: Listing[];
  history: PricePoint[];
  description: string;
};

const buildHistory = (base: number, seed: number): PricePoint[] => {
  const points: PricePoint[] = [];
  let p = base * 1.15;
  const today = new Date();
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const wobble = Math.sin((i + seed) / 6) * base * 0.08;
    const drift = (90 - i) * (base * 0.0015);
    p = base + wobble - drift + (Math.random() - 0.5) * base * 0.02;
    points.push({ date: d.toISOString().slice(0, 10), price: Math.max(Math.round(p), Math.round(base * 0.7)) });
  }
  points[points.length - 1].price = base;
  return points;
};

const make = (
  id: string,
  name: string,
  brand: string,
  category: string,
  image: string,
  price: number,
  mrp: number,
  tag: Product["tag"],
  seed: number,
): Product => {
  const history = buildHistory(price, seed);
  const prices = history.map((h) => h.price);
  return {
    id,
    name,
    brand,
    category,
    image,
    currentPrice: price,
    mrp,
    rating: 4 + (seed % 10) / 10,
    reviews: 200 + seed * 37,
    tag,
    lowest: Math.min(...prices),
    highest: Math.max(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    description:
      "A cult-favorite pick loved for its lightweight feel and clean ingredients. Track price drops so you never overpay again.",
    listings: [
      { marketplace: "Nykaa", price, inStock: true, url: "#" },
      { marketplace: "Amazon", price: price + 40, inStock: true, url: "#" },
      { marketplace: "Myntra", price: price - 15, inStock: true, url: "#" },
      { marketplace: "Tira", price: price + 90, inStock: false, url: "#" },
    ],
    history,
  };
};

export const products: Product[] = [
  make("1", "Ultra Glow Vitamin C Serum 30ml", "Minimalist", "Skincare", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600", 599, 899, "Lowest ever", 3),
  make("2", "Matte Liquid Lipstick — Rosewood", "Maybelline", "Makeup", "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600", 349, 599, "Deal", 7),
  make("3", "Argan Repair Hair Mask 200ml", "L'Oréal", "Haircare", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600", 749, 1099, "Trending", 11),
  make("4", "Hydra Boost Moisturizer 50ml", "Neutrogena", "Skincare", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600", 499, 750, undefined, 14),
  make("5", "Rose Petal Micellar Water", "Simple", "Skincare", "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600", 429, 649, "New", 19),
  make("6", "Volume Boost Mascara Noir", "Lakmé", "Makeup", "https://images.unsplash.com/photo-1631214540553-ff044a3ff1d4?w=600", 275, 425, "Deal", 22),
  make("7", "Coconut Body Butter 250g", "The Body Shop", "Body", "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600", 1195, 1595, undefined, 27),
  make("8", "Salicylic Acid 2% Solution", "The Ordinary", "Skincare", "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600", 850, 990, "Trending", 33),
];

export const categories = [
  { name: "Skincare", emoji: "🧴" },
  { name: "Makeup", emoji: "💄" },
  { name: "Haircare", emoji: "💇" },
  { name: "Fragrance", emoji: "🌸" },
  { name: "Body", emoji: "🧖" },
  { name: "Wellness", emoji: "🌿" },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
