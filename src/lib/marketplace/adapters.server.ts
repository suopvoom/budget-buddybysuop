// Server-only marketplace adapter registry.
// Every adapter implements the SAME interface and returns the SAME normalized
// shape. No adapter fabricates data: without real credentials for a permitted
// data source (official API, affiliate feed or licensed provider) each adapter
// reports "Provider not configured" instead of returning invented prices.

import {
  ProviderNotConfiguredError,
  type AdapterStatus,
  type DataSourceType,
  type NormalizedListing,
} from "./types";

export type MarketplaceAdapter = {
  key: string;
  displayName: string;
  dataSourceType: DataSourceType;
  requiredSecrets: string[];
  docsUrl?: string;
  getProduct(externalId: string): Promise<NormalizedListing>;
  getPrice(externalId: string): Promise<Pick<NormalizedListing, "currentPrice" | "mrp" | "currency" | "availability" | "fetchedAt">>;
  getAvailability(externalId: string): Promise<NormalizedListing["availability"]>;
  searchProducts(query: string): Promise<NormalizedListing[]>;
};

function missing(secrets: string[]): string[] {
  return secrets.filter((name) => !process.env[name]);
}

/**
 * Builds an adapter whose calls fail loudly with ProviderNotConfiguredError
 * until real credentials exist. When credentials are added, replace the
 * `live` implementation with the provider's official client — the rest of the
 * pipeline (normalize → match → upsert listing → price_history → alerts)
 * needs no changes.
 */
function createAdapter(cfg: {
  key: string;
  displayName: string;
  dataSourceType: DataSourceType;
  requiredSecrets: string[];
  docsUrl?: string;
}): MarketplaceAdapter {
  const guard = () => {
    const m = missing(cfg.requiredSecrets);
    if (m.length > 0) throw new ProviderNotConfiguredError(cfg.key, m);
    // Credentials exist but no official client has been wired yet. We refuse
    // to invent data rather than return a plausible-looking fake response.
    throw new Error(
      `Adapter "${cfg.key}" has credentials but no live client implementation yet.`,
    );
  };
  return {
    ...cfg,
    getProduct: async () => guard(),
    getPrice: async () => guard(),
    getAvailability: async () => guard(),
    searchProducts: async () => guard(),
  };
}

export const adapters: Record<string, MarketplaceAdapter> = {
  amazon: createAdapter({
    key: "amazon",
    displayName: "Amazon (Product Advertising API)",
    dataSourceType: "official_api",
    requiredSecrets: ["AMAZON_PAAPI_ACCESS_KEY", "AMAZON_PAAPI_SECRET_KEY", "AMAZON_PAAPI_PARTNER_TAG"],
    docsUrl: "https://webservices.amazon.com/paapi5/documentation/",
  }),
  nykaa: createAdapter({
    key: "nykaa",
    displayName: "Nykaa (affiliate product feed)",
    dataSourceType: "affiliate_feed",
    requiredSecrets: ["NYKAA_FEED_URL", "NYKAA_FEED_TOKEN"],
  }),
  flipkart: createAdapter({
    key: "flipkart",
    displayName: "Flipkart (Affiliate API)",
    dataSourceType: "official_api",
    requiredSecrets: ["FLIPKART_AFFILIATE_ID", "FLIPKART_AFFILIATE_TOKEN"],
  }),
  purplle: createAdapter({
    key: "purplle",
    displayName: "Purplle (affiliate network feed)",
    dataSourceType: "affiliate_feed",
    requiredSecrets: ["PURPLLE_FEED_URL", "PURPLLE_FEED_TOKEN"],
  }),
  tira: createAdapter({
    key: "tira",
    displayName: "Tira (affiliate network feed)",
    dataSourceType: "affiliate_feed",
    requiredSecrets: ["TIRA_FEED_URL", "TIRA_FEED_TOKEN"],
  }),
  licensed_provider: createAdapter({
    key: "licensed_provider",
    displayName: "Licensed product-data provider",
    dataSourceType: "licensed_provider",
    requiredSecrets: ["PRODUCT_DATA_PROVIDER_API_KEY", "PRODUCT_DATA_PROVIDER_BASE_URL"],
  }),
};

export function adapterStatuses(): AdapterStatus[] {
  return Object.values(adapters).map((a) => {
    const missingSecrets = missing(a.requiredSecrets);
    return {
      adapterKey: a.key,
      displayName: a.displayName,
      dataSourceType: a.dataSourceType,
      requiredSecrets: a.requiredSecrets,
      missingSecrets,
      configured: missingSecrets.length === 0,
      ...(a.docsUrl ? { docsUrl: a.docsUrl } : {}),
    };
  });
}

export function getAdapter(key: string): MarketplaceAdapter | undefined {
  return adapters[key];
}
