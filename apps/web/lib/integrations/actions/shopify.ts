import { BaseIntegrationAction } from "./base";

export class ShopifyIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("shopify", connectionId);
  }

  async listProducts(limit: number = 50) {
    return this.request("GET", "/admin/api/2024-01/products.json", undefined, { limit: String(limit) });
  }

  async createProduct(title: string, bodyHtml?: string, vendor?: string) {
    return this.request("POST", "/admin/api/2024-01/products.json", {
      product: { title, body_html: bodyHtml, vendor },
    });
  }

  async listOrders(status: string = "any", limit: number = 50) {
    return this.request("GET", "/admin/api/2024-01/orders.json", undefined, { status, limit: String(limit) });
  }

  async getOrder(orderId: string) {
    return this.request("GET", `/admin/api/2024-01/orders/${orderId}.json`);
  }

  async listCustomers(limit: number = 50) {
    return this.request("GET", "/admin/api/2024-01/customers.json", undefined, { limit: String(limit) });
  }
}
