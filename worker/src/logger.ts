/**
 * Worker 구조화 로깅
 * - JSON 한 줄 출력 → Cloudflare Real-time Logs / wrangler tail / Logpush에서 파싱 용이
 * - 레벨: debug | info | warn | error
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  msg: string;
  ts: string;
  /** 요청 경로 (로그 시점에 있으면 포함) */
  path?: string;
  /** HTTP 메서드 */
  method?: string;
  /** HTTP 상태 코드 */
  status?: number;
  /** 응답까지 소요 시간(ms) */
  duration_ms?: number;
  [key: string]: unknown;
}

function emit(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
  const payload: LogPayload = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...data,
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug(msg: string, data?: Record<string, unknown>) {
    emit("debug", msg, data);
  },
  info(msg: string, data?: Record<string, unknown>) {
    emit("info", msg, data);
  },
  warn(msg: string, data?: Record<string, unknown>) {
    emit("warn", msg, data);
  },
  error(msg: string, data?: Record<string, unknown>) {
    emit("error", msg, data);
  },
  /**
   * 요청/응답 한 줄 로그 (매 요청마다 호출 가능)
   * 4xx/5xx만 로그하려면 호출 전에 status 체크하면 됨
   */
  request(request: Request, response: Response, durationMs: number): void {
    const url = new URL(request.url);
    const status = response.status;
    const payload: LogPayload = {
      level: "info",
      msg: "request",
      ts: new Date().toISOString(),
      method: request.method,
      path: url.pathname,
      status,
      duration_ms: durationMs,
    };
    if (status >= 500) payload.level = "error";
    else if (status >= 400) payload.level = "warn";
    const line = JSON.stringify(payload);
    if (payload.level === "error") console.error(line);
    else console.log(line);
  },
};
