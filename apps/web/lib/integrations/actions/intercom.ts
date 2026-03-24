import { BaseIntegrationAction } from "./base";

export class IntercomIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("intercom", connectionId);
  }

  async createConversation(userId: string, body: string) {
    return this.request("POST", "/conversations", {
      from: { type: "user", id: userId }, body,
    });
  }

  async replyToConversation(conversationId: string, body: string, type: "admin" | "user" = "admin", adminId?: string) {
    return this.request("POST", `/conversations/${conversationId}/reply`, {
      message_type: "comment", type, body, admin_id: adminId,
    });
  }

  async searchContacts(query: string) {
    return this.request("POST", "/contacts/search", {
      query: { field: "email", operator: "~", value: query },
    });
  }

  async createTicket(contactId: string, title: string, description: string) {
    return this.request("POST", "/tickets", {
      ticket_type_id: "1",
      contacts: [{ id: contactId }],
      ticket_attributes: { _default_title_: title, _default_description_: description },
    });
  }
}
