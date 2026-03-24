export interface IntegrationCapability {
  id: string;
  name: string;
  description: string;
  direction: "inbound" | "outbound" | "bidirectional";
}

export interface IntegrationConfigField {
  key: string;
  label: string;
  type: "text" | "select" | "multiselect";
  placeholder?: string;
  fetchOptions?: string;
}

export interface PremiumIntegration {
  id: string;
  nangoKey: string;
  name: string;
  description: string;
  icon: string;
  category: IntegrationCategory;
  tier: "premium";
  capabilities: IntegrationCapability[];
  configFields: IntegrationConfigField[];
}

export type IntegrationCategory =
  | "development"
  | "communication"
  | "project-management"
  | "crm-sales"
  | "support"
  | "google-workspace"
  | "microsoft-365"
  | "marketing-email"
  | "storage-design"
  | "payments-ecommerce";

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  development: "Development",
  communication: "Communication",
  "project-management": "Project Management",
  "crm-sales": "CRM & Sales",
  support: "Support",
  "google-workspace": "Google Workspace",
  "microsoft-365": "Microsoft 365",
  "marketing-email": "Marketing & Email",
  "storage-design": "Storage & Design",
  "payments-ecommerce": "Payments & E-Commerce",
};

export interface GenericCatalogCategory {
  category: string;
  integrations: string[];
}

export interface IntegrationActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
