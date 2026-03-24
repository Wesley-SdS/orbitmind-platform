import { BaseIntegrationAction } from "./base";

export class SlackIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("slack", connectionId);
  }

  async listChannels() {
    return this.request<{ channels: Array<{ id: string; name: string }> }>(
      "GET", "/conversations.list", undefined, { types: "public_channel,private_channel", limit: "200" },
    );
  }

  async sendMessage(channel: string, text: string) {
    return this.request("POST", "/chat.postMessage", { channel, text });
  }

  async sendRichBlock(channel: string, blocks: unknown[], text?: string) {
    return this.request("POST", "/chat.postMessage", { channel, blocks, text: text ?? "" });
  }

  async sendPipelineUpdate(channel: string, squadName: string, status: string, details: string) {
    const color = status === "completed" ? "#36a64f" : status === "failed" ? "#ff0000" : "#f2c744";
    return this.sendRichBlock(channel, [
      { type: "header", text: { type: "plain_text", text: `OrbitMind — ${squadName}` } },
      { type: "section", text: { type: "mrkdwn", text: `*Status:* ${status}\n${details}` } },
    ].map((b) => ({ ...b })), `Pipeline ${status}: ${squadName}`);
  }

  async uploadFile(channel: string, filename: string, content: string) {
    return this.request("POST", "/files.upload", { channels: channel, filename, content });
  }
}
