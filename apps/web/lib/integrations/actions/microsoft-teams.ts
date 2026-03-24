import { BaseIntegrationAction } from "./base";

export class TeamsIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("microsoft-teams", connectionId);
  }

  async listTeams() {
    return this.request<{ value: Array<{ id: string; displayName: string }> }>("GET", "/me/joinedTeams");
  }

  async listChannels(teamId: string) {
    return this.request<{ value: Array<{ id: string; displayName: string }> }>(
      "GET", `/teams/${teamId}/channels`,
    );
  }

  async sendMessage(teamId: string, channelId: string, content: string) {
    return this.request("POST", `/teams/${teamId}/channels/${channelId}/messages`, {
      body: { contentType: "html", content },
    });
  }

  async sendCard(teamId: string, channelId: string, card: Record<string, unknown>) {
    return this.request("POST", `/teams/${teamId}/channels/${channelId}/messages`, {
      body: { contentType: "html", content: "" },
      attachments: [{ contentType: "application/vnd.microsoft.card.adaptive", content: card }],
    });
  }
}
