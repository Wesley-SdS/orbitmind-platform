import type { GenericCatalogCategory } from "./types";

/**
 * Catalogo de 700+ integracoes via Nango.
 * Auth via Nango Connect UI, proxy requests via nangoRequest().
 * Sem actions customizadas — o agente usa a API diretamente via proxy.
 */
export const GENERIC_CATALOG: GenericCatalogCategory[] = [
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

/** Total de integracoes genericas */
export const GENERIC_TOTAL = GENERIC_CATALOG.reduce(
  (acc, cat) => acc + cat.integrations.length,
  0,
);

/** Busca integracao generica por ID */
export function findGenericIntegration(id: string): { category: string; id: string } | null {
  for (const cat of GENERIC_CATALOG) {
    if (cat.integrations.includes(id)) {
      return { category: cat.category, id };
    }
  }
  return null;
}
