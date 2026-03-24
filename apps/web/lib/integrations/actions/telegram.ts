import { BaseIntegrationAction } from "./base";

export class TelegramIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("telegram", connectionId);
  }

  async sendMessage(chatId: string, text: string, parseMode?: "HTML" | "Markdown") {
    return this.request("POST", "/sendMessage", { chat_id: chatId, text, parse_mode: parseMode });
  }

  async sendPhoto(chatId: string, photo: string, caption?: string) {
    return this.request("POST", "/sendPhoto", { chat_id: chatId, photo, caption });
  }

  async sendDocument(chatId: string, document: string, caption?: string) {
    return this.request("POST", "/sendDocument", { chat_id: chatId, document, caption });
  }
}
