// Shared, client-safe types for the marketplace data-ingestion layer.
// No credentials or provider logic live here.

export type Availability = "in_stock" | "out_of_stock" | "limited" | "unknown";

/** The single normalized shape every marketplace adapter must return. */
export type NormalizedListing = {
  externalProductId: string;
  productUrl: string;
  normalizedUrl: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  sku?: string;
  barcode?: string;
  currentPrice: number;
  mrp?: number;
  discountPercentage?: number;
  currency: string;
  availability: Availability;
  sellerName?: string;
  deliveryInformation?: string;
  couponInformation?: string;
  /** Which permitted channel this came from. */
  dataSource: DataSourceType;
  fetchedAt: string;
};

export type DataSourceType =
  | "official_api"
  | "affiliate_feed"
  | "licensed_provider"
  | "manual"
  | "csv_import";

export type AdapterStatus = {
  adapterKey: string;
  displayName: string;
  dataSourceType: DataSourceType;
  /** Names of the secrets this adapter needs before it can run. */
  requiredSecrets: string[];
  missingSecrets: string[];
  configured: boolean;
  docsUrl?: string;
};

/** Thrown/returned when an adapter is invoked without credentials. */
export class ProviderNotConfiguredError extends Error {
  constructor(public adapterKey: string, public missingSecrets: string[]) {
    super(
      `Provider not configured: ${adapterKey}. Missing credentials: ${missingSecrets.join(", ")}`,
    );
    this.name = "ProviderNotConfiguredError";
  }
}

export function normalizeProductUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    // Drop tracking / affiliate params so duplicates collapse to one listing.
    const drop = /^(utm_|ref|ref_|tag|affid|aff_|gclid|fbclid|source|pf_rd|psc|th|linkCode|creative)/i;
    [...u.searchParams.keys()].forEach((k) => {
      if (drop.test(k)) u.searchParams.delete(k);
    });
    u.hostname = u.hostname.replace(/^www\./, "").toLowerCase();
    u.pathname = u.pathname.replace(/\/+$/, "");
    return `${u.protocol}//${u.hostname}${u.pathname}${u.search}`;
  } catch {
    return raw.trim().toLowerCase();
  }
}

export function detectMarketplaceFromUrl(raw: string): string | null {
  const host = (() => {
    try {
      return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  })();
  if (host.includes("amazon.")) return "amazon";
  if (host.includes("nykaa.")) return "nykaa";
  if (host.includes("flipkart.")) return "flipkart";
  if (host.includes("purplle.")) return "purplle";
  if (host.includes("tirabeauty.") || host.includes("tira.")) return "tira";
  return null;
}
