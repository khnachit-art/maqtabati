type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
}

const buffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush(): void {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0);
  for (const log of batch) {
    const ts = log.timestamp.toISOString();
    if (log.level === "ERROR") {
      console.error(`[${ts}] [${log.level}] ${log.message}`);
    } else if (log.level === "WARN") {
      console.warn(`[${ts}] [${log.level}] ${log.message}`);
    } else {
      console.log(`[${ts}] [${log.level}] ${log.message}`);
    }
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flush();
    flushTimer = null;
  }, 1000);
}

export const logger = {
  info: (msg: string) => {
    buffer.push({ level: "INFO", message: msg, timestamp: new Date() });
    scheduleFlush();
  },
  warn: (msg: string) => {
    buffer.push({ level: "WARN", message: msg, timestamp: new Date() });
    scheduleFlush();
  },
  error: (msg: string) => {
    buffer.push({ level: "ERROR", message: msg, timestamp: new Date() });
    scheduleFlush();
  },
};
