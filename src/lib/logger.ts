export type LogLevel = 'info' | 'warn' | 'error';

export interface LogContext {
  requestId: string;
  route?: string;
  ip?: string;
}

export interface Logger {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

function emit(level: LogLevel, ctx: LogContext, message: string, data?: Record<string, unknown>) {
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    requestId: ctx.requestId,
    route: ctx.route,
    ip: ctx.ip,
    ...data
  } as const;
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function getLogger(ctx: LogContext): Logger {
  return {
    info: (message, data) => emit('info', ctx, message, data),
    warn: (message, data) => emit('warn', ctx, message, data),
    error: (message, data) => emit('error', ctx, message, data)
  };
}
