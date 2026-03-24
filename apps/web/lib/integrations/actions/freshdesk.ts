import { BaseIntegrationAction } from "./base";

export class FreshdeskIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("freshdesk", connectionId);
  }

  async createTicket(subject: string, description: string, email: string, priority?: number, status?: number) {
    return this.request("POST", "/api/v2/tickets", {
      subject, description, email, priority: priority ?? 1, status: status ?? 2,
    });
  }

  async updateTicket(ticketId: number, data: Record<string, unknown>) {
    return this.request("PUT", `/api/v2/tickets/${ticketId}`, data);
  }

  async listTickets() {
    return this.request("GET", "/api/v2/tickets");
  }

  async listAgents() {
    return this.request("GET", "/api/v2/agents");
  }
}
