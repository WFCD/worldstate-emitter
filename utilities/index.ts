import { createLogger, format, type Logger, transports } from 'winston';
import { LOG_LEVEL } from '@/utilities/env';

export enum LogLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  SILLY = 'silly',
}
const levels = {
  [LogLevel.FATAL]: 0,
  [LogLevel.ERROR]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.INFO]: 3,
  [LogLevel.DEBUG]: 4,
  [LogLevel.SILLY]: 5,
};

let loggerInstance: Logger;
try {
  const { combine, label, printf, colorize } = format;

  /* Logger setup */
  const transport = new transports.Console();
  const logFormat = printf((info) => `[${info.label}] ${info.level}: ${info.message}`);
  loggerInstance = createLogger({
    format: combine(colorize(), label({ label: 'WS' }), logFormat),
    transports: [transport],
    level: LOG_LEVEL,
    levels,
  });
  loggerInstance.level = LOG_LEVEL;
} catch (_e) {
  // Fallback to console wrapped as Logger
  loggerInstance = createLogger({
    transports: [new transports.Console()],
    level: LOG_LEVEL,
    levels,
  });
}

/**
 * Replace the module-wide logger used by emitter internals.
 * Call before constructing handlers when injecting a host-provided logger.
 */
export const setLogger = (uLogger: Logger): void => {
  loggerInstance = uLogger;
};

/** Global logger proxy so existing imports pick up setLogger() overrides. */
export const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop) {
    const value = Reflect.get(loggerInstance, prop, loggerInstance);
    return typeof value === 'function' ? value.bind(loggerInstance) : value;
  },
  set(_target, prop, value) {
    Reflect.set(loggerInstance, prop, value);
    return true;
  },
});

/**
 * Group an array by a field value
 * @param array - array of objects to group
 * @param field - field to group by
 * @returns Grouped object
 */
export const groupBy = <T extends object>(array: T[] | undefined, field: keyof T): Record<string, T[]> | undefined => {
  const grouped: Record<string, T[]> = {};
  if (!array) return undefined;
  for (const item of array) {
    const fVal = String(item[field]);
    if (!grouped[fVal]) {
      grouped[fVal] = [];
    }
    grouped[fVal].push(item);
  }
  return grouped;
};

const allowedDeviation = 30000;
/**
 * Validate that b is between a and c
 * @param a - The first Date, should be the last time things were updated
 * @param b - The second Date, should be the activation time of an event
 * @param c - The third Date, should be the start time of this update cycle
 * @returns if the event date is between the server start time and the last update time
 */
export const between = (a: number, b: number, c: number = Date.now()): boolean =>
  b + allowedDeviation > a && b - allowedDeviation < c;

/**
 * Returns the number of milliseconds between now and a given date
 * @param d - The date from which the current time will be subtracted
 * @param now - A function that returns the current UNIX time in milliseconds
 * @returns Milliseconds from now
 */
export function fromNow(d: string | Date, now: () => number = Date.now): number {
  return new Date(d).getTime() - now();
}

/**
 * Map of last updated dates/times
 */
export const lastUpdated: Record<string, Record<string, number>> = {
  pc: {
    en: 0, // Date.now(),
  },
  ps4: {
    en: Date.now(),
  },
  xb1: {
    en: Date.now(),
  },
  swi: {
    en: Date.now(),
  },
};
