/**
 * Worker 구조화 로깅
 * - json: JSON 한 줄 (파싱·Logpush용)
 * - readable: 사람이 보기 좋은 한 줄 (wrangler tail 등)
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFormat = "json" | "readable";

interface LogPayload {
  level: LogLevel;
  msg: string;
  ts: string;
  path?: string;
  method?: string;
  status?: number;
  duration_ms?: number;
  ip?: string;
  user?: string;
  [key: string]: unknown;
}

let outputFormat: LogFormat = "json";

/** 포맷 설정 (env.LOG_FORMAT). fetch 진입 시 호출 */
export function setLogFormat(format: LogFormat): void {
  outputFormat = format === "readable" ? "readable" : "json";
}

function levelTag(level: LogLevel): string {
  return level.toUpperCase().padEnd(5);
}

function toReadablePayload(payload: LogPayload): string {
  const { level, msg, method, path, status, duration_ms, ip, user } = payload;
  if (msg === "request" && method != null && path != null && status != null && duration_ms != null) {
    const parts = [`[${levelTag(level)}]`, method, path, String(status), `${duration_ms}ms`];
    if (ip) parts.push(`ip=${ip}`);
    if (user) parts.push(`user=${user}`);
    return parts.join("  ");
  }
  const extra = Object.entries(payload)
    .filter(([k]) => !["level", "msg", "ts"].includes(k))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join("  ");
  return extra ? `[${levelTag(level)}]  ${msg}  ${extra}` : `[${levelTag(level)}]  ${msg}`;
}

function emit(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
  const payload: LogPayload = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...data,
  };
  const line = outputFormat === "readable" ? toReadablePayload(payload) : JSON.stringify(payload);
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
   * @param who - ip: 클라이언트 IP, user: 로그인 사용자(예: Access 이메일). 있으면 "누가" 추적 가능
   */
  request(
    request: Request,
    response: Response,
    durationMs: number,
    who?: { ip?: string; user?: string }
  ): void {
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
      ...(who?.ip && { ip: who.ip }),
      ...(who?.user && { user: who.user }),
    };
    if (status >= 500) payload.level = "error";
    else if (status >= 400) payload.level = "warn";
    const line = outputFormat === "readable" ? toReadablePayload(payload) : JSON.stringify(payload);
    if (payload.level === "error") console.error(line);
    else console.log(line);
  },
};
