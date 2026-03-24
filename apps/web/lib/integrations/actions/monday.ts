import { BaseIntegrationAction } from "./base";

export class MondayIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("monday", connectionId);
  }

  async listBoards() {
    return this.request("POST", "/v2", {
      query: `{ boards(limit: 50) { id name groups { id title } } }`,
    });
  }

  async listGroups(boardId: string) {
    return this.request("POST", "/v2", {
      query: `{ boards(ids: [${boardId}]) { groups { id title } } }`,
    });
  }

  async createItem(boardId: string, groupId: string, itemName: string, columnValues?: Record<string, unknown>) {
    const colVals = columnValues ? JSON.stringify(JSON.stringify(columnValues)) : '"{}"';
    return this.request("POST", "/v2", {
      query: `mutation { create_item(board_id: ${boardId}, group_id: "${groupId}", item_name: "${itemName}", column_values: ${colVals}) { id name } }`,
    });
  }

  async updateItem(boardId: string, itemId: string, columnValues: Record<string, unknown>) {
    const colVals = JSON.stringify(JSON.stringify(columnValues));
    return this.request("POST", "/v2", {
      query: `mutation { change_multiple_column_values(board_id: ${boardId}, item_id: ${itemId}, column_values: ${colVals}) { id } }`,
    });
  }
}
