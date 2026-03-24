import { nangoRequest } from "../nango-client";
import type { IntegrationActionResult } from "../types";

export abstract class BaseIntegrationAction {
  constructor(
    protected readonly providerConfigKey: string,
    protected readonly connectionId: string,
  ) {}

  protected async request<T = unknown>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    endpoint: string,
    data?: unknown,
    params?: Record<string, string>,
  ): Promise<IntegrationActionResult<T>> {
    try {
      const result = await nangoRequest<T>({
        method,
        endpoint,
        providerConfigKey: this.providerConfigKey,
        connectionId: this.connectionId,
        data,
        params,
      });
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}
