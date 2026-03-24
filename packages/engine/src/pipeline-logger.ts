export interface PipelineLogEntry {
  timestamp: string;
  runId: string;
  squadId: string;
  level: "info" | "warn" | "error" | "debug";
  event: string;
  data?: Record<string, unknown>;
}

export class PipelineLogger {
  private logs: PipelineLogEntry[] = [];
  private runId: string;
  private squadId: string;

  constructor(squadId: string, runId: string) {
    this.squadId = squadId;
    this.runId = runId;
  }

  info(event: string, data?: Record<string, unknown>) {
    this.add("info", event, data);
  }

  warn(event: string, data?: Record<string, unknown>) {
    this.add("warn", event, data);
  }

  error(event: string, data?: Record<string, unknown>) {
    this.add("error", event, data);
  }

  debug(event: string, data?: Record<string, unknown>) {
    this.add("debug", event, data);
  }

  private add(level: PipelineLogEntry["level"], event: string, data?: Record<string, unknown>) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      runId: this.runId,
      squadId: this.squadId,
      level,
      event,
      data,
    });
  }

  getLogs(): PipelineLogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: PipelineLogEntry["level"]): PipelineLogEntry[] {
    return this.logs.filter((l) => l.level === level);
  }

  clear() {
    this.logs = [];
  }
}
