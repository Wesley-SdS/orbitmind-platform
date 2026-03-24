import { BaseIntegrationAction } from "./base";

export class ZendeskIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("zendesk", connectionId);
  }

  async createTicket(subject: string, description: string, priority?: "urgent" | "high" | "normal" | "low") {
    return this.request("POST", "/api/v2/tickets", {
      ticket: { subject, description, priority: priority ?? "normal" },
    });
  }

  async updateTicket(ticketId: number, data: Record<string, unknown>) {
    return this.request("PUT", `/api/v2/tickets/${ticketId}`, { ticket: data });
  }

  async searchTickets(query: string) {
    return this.request("GET", "/api/v2/search", undefined, { query: `type:ticket ${query}` });
  }

  async listUsers() {
    return this.request("GET", "/api/v2/users");
  }

  async addComment(ticketId: number, body: string, isPublic: boolean = true) {
    return this.request("PUT", `/api/v2/tickets/${ticketId}`, {
      ticket: { comment: { body, public: isPublic } },
    });
  }
}
