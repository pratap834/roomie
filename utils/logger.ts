type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

function formatEntry(entry: LogEntry): string {
  const parts: string[] = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
  ];

  if (entry.context) {
    parts.push(`[${entry.context}]`);
  }

  parts.push(entry.message);

  if (entry.data !== undefined) {
    parts.push(JSON.stringify(entry.data));
  }

  return parts.join(" ");
}

function createEntry(
  level: LogLevel,
  message: string,
  data?: unknown,
  context?: string,
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
  };
}

class Logger {
  private readonly context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === "production") return;
    const entry = createEntry("debug", message, data, this.context);
    console.debug(formatEntry(entry));
  }

  info(message: string, data?: unknown): void {
    const entry = createEntry("info", message, data, this.context);
    console.info(formatEntry(entry));
  }

  warn(message: string, data?: unknown): void {
    const entry = createEntry("warn", message, data, this.context);
    console.warn(formatEntry(entry));
  }

  error(message: string, error?: unknown): void {
    const data =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
    const entry = createEntry("error", message, data, this.context);
    console.error(formatEntry(entry));
  }

  child(context: string): Logger {
    const childContext = this.context ? `${this.context}:${context}` : context;
    return new Logger(childContext);
  }
}

export const logger = new Logger();

export function createLogger(context: string): Logger {
  return new Logger(context);
}

export type { Logger, LogLevel };
