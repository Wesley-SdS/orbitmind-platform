import { BaseIntegrationAction } from "./base";

export class NotionIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("notion", connectionId);
  }

  async listDatabases() {
    return this.request("POST", "/v1/search", {
      filter: { property: "object", value: "database" },
    });
  }

  async queryDatabase(databaseId: string, filter?: Record<string, unknown>, sorts?: unknown[]) {
    return this.request("POST", `/v1/databases/${databaseId}/query`, { filter, sorts });
  }

  async createPage(parentDatabaseId: string, properties: Record<string, unknown>, children?: unknown[]) {
    return this.request("POST", "/v1/pages", {
      parent: { database_id: parentDatabaseId },
      properties,
      ...(children ? { children } : {}),
    });
  }

  async updatePage(pageId: string, properties: Record<string, unknown>) {
    return this.request("PATCH", `/v1/pages/${pageId}`, { properties });
  }

  async appendBlocks(pageId: string, children: unknown[]) {
    return this.request("PATCH", `/v1/blocks/${pageId}/children`, { children });
  }

  async search(query: string) {
    return this.request("POST", "/v1/search", { query });
  }
}
