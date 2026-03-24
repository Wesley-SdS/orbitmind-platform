import { BaseIntegrationAction } from "./base";

export class ConfluenceIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("confluence", connectionId);
  }

  async getSpace(spaceKey: string) {
    return this.request("GET", `/wiki/api/v2/spaces`, undefined, { keys: spaceKey });
  }

  async createPage(spaceId: string, title: string, body: string, parentId?: string) {
    return this.request("POST", "/wiki/api/v2/pages", {
      spaceId, title, parentId,
      body: { representation: "storage", value: body },
      status: "current",
    });
  }

  async updatePage(pageId: string, title: string, body: string, version: number) {
    return this.request("PUT", `/wiki/api/v2/pages/${pageId}`, {
      id: pageId, title,
      body: { representation: "storage", value: body },
      version: { number: version + 1 },
      status: "current",
    });
  }

  async searchPages(query: string) {
    return this.request("GET", "/wiki/rest/api/search", undefined, { cql: query });
  }
}
