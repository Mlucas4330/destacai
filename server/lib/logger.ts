import pino from 'pino'

// No pino transport (e.g. pino-pretty): transports spawn worker threads that
// don't resolve inside Next.js's bundled server runtime. Plain JSON to stdout
// works in dev and production.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
})
