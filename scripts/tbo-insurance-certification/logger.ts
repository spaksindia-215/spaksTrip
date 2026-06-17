import * as fs from "fs";
import * as path from "path";

export type LogLevel = "debug" | "info" | "warn" | "error";

export class Logger {
  private caseId: string;
  private outputDir: string;
  private logLevel: LogLevel;
  private logs: Array<{ level: LogLevel; message: string; timestamp: string }> =
    [];

  constructor(caseId: string, outputDir: string, logLevel: LogLevel = "info") {
    this.caseId = caseId;
    this.outputDir = outputDir;
    this.logLevel = logLevel;
  }

  private getLevelPriority(level: LogLevel): number {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.getLevelPriority(level) >= this.getLevelPriority(this.logLevel);
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string): string {
    return `[${this.formatTimestamp()}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string): void {
    if (this.shouldLog("debug")) {
      const formatted = this.formatMessage("debug", message);
      console.log(formatted);
      this.logs.push({
        level: "debug",
        message,
        timestamp: this.formatTimestamp(),
      });
    }
  }

  info(message: string): void {
    if (this.shouldLog("info")) {
      const formatted = this.formatMessage("info", message);
      console.log(formatted);
      this.logs.push({ level: "info", message, timestamp: this.formatTimestamp() });
    }
  }

  warn(message: string): void {
    if (this.shouldLog("warn")) {
      const formatted = this.formatMessage("warn", message);
      console.warn(formatted);
      this.logs.push({ level: "warn", message, timestamp: this.formatTimestamp() });
    }
  }

  error(message: string): void {
    if (this.shouldLog("error")) {
      const formatted = this.formatMessage("error", message);
      console.error(formatted);
      this.logs.push({
        level: "error",
        message,
        timestamp: this.formatTimestamp(),
      });
    }
  }

  saveRequestResponse(
    stepName: string,
    request: unknown,
    response: unknown,
    isError: boolean = false
  ): void {
    const caseDir = path.join(this.outputDir, this.caseId);

    if (!fs.existsSync(caseDir)) {
      fs.mkdirSync(caseDir, { recursive: true });
    }

    const requestFile = path.join(
      caseDir,
      `${stepName}-${isError ? "error-" : ""}request.json`
    );
    const responseFile = path.join(
      caseDir,
      `${stepName}-${isError ? "error-" : ""}response.json`
    );

    fs.writeFileSync(requestFile, JSON.stringify(request, null, 2), "utf-8");
    fs.writeFileSync(responseFile, JSON.stringify(response, null, 2), "utf-8");

    this.info(`Saved ${stepName} ${isError ? "error " : ""}logs`);
  }

  saveSummary(summary: unknown): void {
    const caseDir = path.join(this.outputDir, this.caseId);

    if (!fs.existsSync(caseDir)) {
      fs.mkdirSync(caseDir, { recursive: true });
    }

    const summaryFile = path.join(caseDir, "summary.json");
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), "utf-8");
  }

  saveRawSummaryText(content: string): void {
    const caseDir = path.join(this.outputDir, this.caseId);

    if (!fs.existsSync(caseDir)) {
      fs.mkdirSync(caseDir, { recursive: true });
    }

    const summaryFile = path.join(caseDir, "summary.txt");
    fs.writeFileSync(summaryFile, content, "utf-8");
  }

  getLogs(): Array<{ level: LogLevel; message: string; timestamp: string }> {
    return this.logs;
  }
}
