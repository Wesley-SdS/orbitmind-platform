import { BaseIntegrationAction } from "./base";

export class GoogleSheetsIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("google-sheets", connectionId);
  }

  async readRange(spreadsheetId: string, range: string) {
    return this.request("GET", `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`);
  }

  async writeRange(spreadsheetId: string, range: string, values: unknown[][]) {
    return this.request("PUT", `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
      values,
    }, { valueInputOption: "USER_ENTERED" });
  }

  async appendRows(spreadsheetId: string, range: string, values: unknown[][]) {
    return this.request("POST", `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append`, {
      values,
    }, { valueInputOption: "USER_ENTERED", insertDataOption: "INSERT_ROWS" });
  }

  async createSpreadsheet(title: string) {
    return this.request("POST", "/v4/spreadsheets", {
      properties: { title },
    });
  }

  async listSheets(spreadsheetId: string) {
    return this.request("GET", `/v4/spreadsheets/${spreadsheetId}`, undefined, { fields: "sheets.properties" });
  }
}
