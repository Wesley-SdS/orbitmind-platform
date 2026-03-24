import { BaseIntegrationAction } from "./base";

export class DiscordIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("discord", connectionId);
  }

  async listChannels(guildId: string) {
    return this.request<Array<{ id: string; name: string; type: number }>>(
      "GET", `/guilds/${guildId}/channels`,
    );
  }

  async sendMessage(channelId: string, content: string) {
    return this.request("POST", `/channels/${channelId}/messages`, { content });
  }

  async sendEmbed(channelId: string, embed: { title: string; description: string; color?: number; fields?: Array<{ name: string; value: string; inline?: boolean }> }) {
    return this.request("POST", `/channels/${channelId}/messages`, { embeds: [embed] });
  }
}
