import type { GenericCatalogCategory } from "./types";
import { fetchNangoProviders, type NangoProvider } from "./nango-client";
import { PREMIUM_INTEGRATIONS } from "./premium-integrations";

/**
 * Catalogo ESTATICO de integracoes genericas — usado como fallback
 * quando a API do Nango nao esta disponivel (dev sem key, offline, etc).
 */
export const STATIC_CATALOG: GenericCatalogCategory[] = [
  {
    category: "Accounting & Finance",
    integrations: [
      "quickbooks", "xero", "netsuite", "sage", "wave", "zoho-books",
      "freshbooks", "bill", "braintree", "adyen", "chargebee", "recurly",
    ],
  },
  {
    category: "HR & Recruitment",
    integrations: [
      "bamboohr", "workday", "gusto", "rippling", "deel", "remote",
      "greenhouse", "lever", "ashby", "breezy-hr", "factorial", "personio",
      "dayforce", "adp", "adp-workforce-now", "employment-hero",
    ],
  },
  {
    category: "Analytics & Data",
    integrations: [
      "amplitude", "mixpanel", "segment", "datadog", "new-relic",
      "pendo", "hotjar", "google-analytics", "tableau", "looker",
      "snowflake", "bigquery", "databricks", "posthog",
    ],
  },
  {
    category: "Marketing & Ads",
    integrations: [
      "google-ads", "facebook-ads", "linkedin-ads", "twitter-ads",
      "tiktok-ads", "pinterest", "buffer", "hootsuite", "later",
      "sprout-social", "klaviyo", "activecampaign", "convertkit",
    ],
  },
  {
    category: "AI & ML",
    integrations: [
      "openai", "anthropic", "google-gemini", "cohere", "replicate",
      "huggingface", "elevenlabs", "stability-ai",
    ],
  },
  {
    category: "Cloud & Infrastructure",
    integrations: [
      "aws", "azure-blob-storage", "digital-ocean", "vercel",
      "cloudflare", "netlify", "heroku", "railway",
    ],
  },
  {
    category: "E-Signing & Legal",
    integrations: [
      "docusign", "dropbox-sign", "pandadoc", "boldsign",
    ],
  },
  {
    category: "Video & Meetings",
    integrations: [
      "zoom", "loom", "gong", "chorus", "fireflies", "avoma",
      "google-meet", "calendly", "cal-com",
    ],
  },
  {
    category: "Social Media",
    integrations: [
      "facebook", "instagram-basic", "linkedin", "twitter",
      "tiktok", "youtube", "reddit",
    ],
  },
  {
    category: "Other",
    integrations: [
      "zapier", "make", "n8n", "ifttt", "webhooks",
      "twilio", "vonage", "sendbird", "onesignal", "pusher",
    ],
  },
];

/** Total de integracoes no catalogo estatico */
export const STATIC_TOTAL = STATIC_CATALOG.reduce(
  (acc, cat) => acc + cat.integrations.length,
  0,
);

// ──────────────────────────────────────────────
// Catalogo Dinamico (700+ via Nango API)
// ──────────────────────────────────────────────

/** Mapeamento de categorias do Nango para nossas categorias de display */
const NANGO_CATEGORY_MAP: Record<string, string> = {
  accounting: "Accounting & Finance",
  finance: "Accounting & Finance",
  hr: "HR & Recruitment",
  recruitment: "HR & Recruitment",
  analytics: "Analytics & Data",
  data: "Analytics & Data",
  marketing: "Marketing & Ads",
  ads: "Marketing & Ads",
  advertising: "Marketing & Ads",
  ai: "AI & ML",
  ml: "AI & ML",
  cloud: "Cloud & Infrastructure",
  infrastructure: "Cloud & Infrastructure",
  devops: "Cloud & Infrastructure",
  "e-signing": "E-Signing & Legal",
  legal: "E-Signing & Legal",
  video: "Video & Meetings",
  meetings: "Video & Meetings",
  social: "Social Media",
  "social-media": "Social Media",
  communication: "Communication",
  messaging: "Communication",
  "project-management": "Project Management",
  productivity: "Productivity",
  crm: "CRM & Sales",
  sales: "CRM & Sales",
  support: "Support & Helpdesk",
  helpdesk: "Support & Helpdesk",
  "customer-support": "Support & Helpdesk",
  storage: "Storage & Files",
  files: "Storage & Files",
  design: "Design",
  payments: "Payments & E-Commerce",
  "e-commerce": "Payments & E-Commerce",
  ecommerce: "Payments & E-Commerce",
  email: "Email",
  security: "Security & Identity",
  identity: "Security & Identity",
  "developer-tools": "Developer Tools",
  development: "Developer Tools",
};

function mapNangoCategory(categories: string[]): string {
  for (const cat of categories) {
    const mapped = NANGO_CATEGORY_MAP[cat.toLowerCase()];
    if (mapped) return mapped;
  }
  return "Other";
}

export interface DynamicProvider {
  id: string;
  displayName: string;
  logoUrl: string;
  authMode: string;
  category: string;
  docs: string;
}

export interface DynamicCatalog {
  categories: Array<{
    category: string;
    providers: DynamicProvider[];
  }>;
  totalProviders: number;
  source: "nango-api" | "static-fallback";
}

/**
 * Busca o catalogo completo de integracoes.
 *
 * 1. Tenta fetch dinamico do Nango API (700+ providers)
 * 2. Exclui os que ja sao premium (evita duplicata)
 * 3. Organiza por categoria
 * 4. Se falhar, usa catalogo estatico como fallback
 */
export async function fetchDynamicCatalog(): Promise<DynamicCatalog> {
  const premiumIds = new Set(PREMIUM_INTEGRATIONS.map((p) => p.id));

  try {
    const nangoProviders = await fetchNangoProviders();

    if (nangoProviders.length === 0) {
      return buildStaticFallback(premiumIds);
    }

    // Filtrar providers premium (ja tratados separadamente)
    const genericProviders = nangoProviders
      .filter((p) => !premiumIds.has(p.name))
      .map((p): DynamicProvider => ({
        id: p.name,
        displayName: p.displayName,
        logoUrl: p.logoUrl,
        authMode: p.authMode,
        category: mapNangoCategory(p.categories),
        docs: p.docs,
      }));

    // Agrupar por categoria
    const categoryMap = new Map<string, DynamicProvider[]>();
    for (const provider of genericProviders) {
      const list = categoryMap.get(provider.category) ?? [];
      list.push(provider);
      categoryMap.set(provider.category, list);
    }

    // Ordenar categorias e providers dentro de cada categoria
    const categories = [...categoryMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, providers]) => ({
        category,
        providers: providers.sort((a, b) => a.displayName.localeCompare(b.displayName)),
      }));

    return {
      categories,
      totalProviders: genericProviders.length,
      source: "nango-api",
    };
  } catch {
    return buildStaticFallback(premiumIds);
  }
}

function buildStaticFallback(premiumIds: Set<string>): DynamicCatalog {
  const categories = STATIC_CATALOG.map((cat) => ({
    category: cat.category,
    providers: cat.integrations
      .filter((id) => !premiumIds.has(id))
      .map((id): DynamicProvider => ({
        id,
        displayName: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        logoUrl: "",
        authMode: "UNKNOWN",
        category: cat.category,
        docs: "",
      })),
  })).filter((cat) => cat.providers.length > 0);

  const total = categories.reduce((acc, cat) => acc + cat.providers.length, 0);

  return {
    categories,
    totalProviders: total,
    source: "static-fallback",
  };
}

/** Busca integracao generica por ID no catalogo estatico */
export function findGenericIntegration(id: string): { category: string; id: string } | null {
  for (const cat of STATIC_CATALOG) {
    if (cat.integrations.includes(id)) {
      return { category: cat.category, id };
    }
  }
  return null;
}

// Re-export para backward compat
export const GENERIC_CATALOG = STATIC_CATALOG;
export const GENERIC_TOTAL = STATIC_TOTAL;
