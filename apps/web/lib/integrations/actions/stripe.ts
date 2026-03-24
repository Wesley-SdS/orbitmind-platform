import { BaseIntegrationAction } from "./base";

export class StripeIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("stripe", connectionId);
  }

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
    return this.request("POST", "/v1/customers", { email, name, metadata });
  }

  async createSubscription(customerId: string, priceId: string) {
    return this.request("POST", "/v1/subscriptions", {
      customer: customerId, items: [{ price: priceId }],
    });
  }

  async listInvoices(customerId?: string, limit: number = 20) {
    const params: Record<string, string> = { limit: String(limit) };
    if (customerId) params.customer = customerId;
    return this.request("GET", "/v1/invoices", undefined, params);
  }

  async getBalance() {
    return this.request("GET", "/v1/balance");
  }
}
