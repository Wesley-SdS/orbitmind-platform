import { BaseIntegrationAction } from "./base";

export class OutlookIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("outlook", connectionId);
  }

  async sendEmail(to: string, subject: string, body: string, isHtml: boolean = false) {
    return this.request("POST", "/me/sendMail", {
      message: {
        subject,
        body: { contentType: isHtml ? "HTML" : "Text", content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
    });
  }

  async listMessages(top: number = 20) {
    return this.request("GET", "/me/messages", undefined, { $top: String(top), $orderby: "receivedDateTime desc" });
  }

  async readMessage(messageId: string) {
    return this.request("GET", `/me/messages/${messageId}`);
  }

  async createDraft(to: string, subject: string, body: string) {
    return this.request("POST", "/me/messages", {
      subject,
      body: { contentType: "Text", content: body },
      toRecipients: [{ emailAddress: { address: to } }],
    });
  }

  async createEvent(subject: string, start: string, end: string, attendees?: string[]) {
    return this.request("POST", "/me/events", {
      subject,
      start: { dateTime: start, timeZone: "UTC" },
      end: { dateTime: end, timeZone: "UTC" },
      attendees: attendees?.map((email) => ({ emailAddress: { address: email }, type: "required" })),
    });
  }

  async listCalendarEvents(top: number = 20) {
    return this.request("GET", "/me/events", undefined, { $top: String(top), $orderby: "start/dateTime" });
  }
}
