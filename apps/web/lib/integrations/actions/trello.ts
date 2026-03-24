import { BaseIntegrationAction } from "./base";

export class TrelloIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("trello", connectionId);
  }

  async listBoards() {
    return this.request<Array<{ id: string; name: string }>>("GET", "/members/me/boards");
  }

  async listLists(boardId: string) {
    return this.request<Array<{ id: string; name: string }>>("GET", `/boards/${boardId}/lists`);
  }

  async createCard(listId: string, name: string, desc?: string) {
    return this.request("POST", "/cards", undefined, {
      idList: listId, name, ...(desc ? { desc } : {}),
    });
  }

  async updateCard(cardId: string, data: Record<string, string>) {
    return this.request("PUT", `/cards/${cardId}`, undefined, data);
  }

  async moveCard(cardId: string, listId: string) {
    return this.request("PUT", `/cards/${cardId}`, undefined, { idList: listId });
  }

  async addComment(cardId: string, text: string) {
    return this.request("POST", `/cards/${cardId}/actions/comments`, undefined, { text });
  }
}
