'use strict';

let logger;
try {
  require('colors');
  const { transports, createLogger, format } = require('winston');

  const {
    combine, label, printf, colorize,
  } = format;

  /* Logger setup */
  const transport = new transports.Console({ colorize: true });
  const logFormat = printf((info) => `[${info.label}] ${info.level}: ${info.message}`);
  const logger = createLogger({
    format: combine(
      colorize(),
      label({ label: 'WS'.brightBlue }),
      logFormat,
    ),
    transports: [transport],
  });
  logger.level = process.env.LOG_LEVEL || 'error';
} catch (e) {
  logger = console;
}

/**
 * Group an array by a field value
 * @param  {Object[]} array array of objects to broup
 * @param  {string} field field to group by
 * @returns {Object}       [description]
 */
const groupBy = (array, field) => {
  const grouped = {};
  if (!array) return undefined;
  array.forEach((item) => {
    const fVal = item[field];
    if (!grouped[fVal]) {
      grouped[fVal] = [];
    }
    grouped[fVal].push(item);
  });
  return grouped;
};

const allowedDeviation = 30000;
/**
 * Validate that b is between a and c
 * @param  {Date} a The first Date, should be the last time things were updated
 * @param  {Date} b The second Date, should be the activation time of an event
 * @param  {Date} c The third Date, should be the start time of this update cycle
 * @returns {boolean}   if the event date is between the server start time and the last update time
 */
const between = (a, b, c = new Date()) => (b + allowedDeviation > a) && (b - allowedDeviation < c);

/**
 * Returns the number of milliseconds between now and a given date
 * @param   {string} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
function fromNow(d, now = Date.now) {
  return new Date(d).getTime() - now();
}

/**
 * Map of last updated dates/times
 * @type {Object}
 */
const lastUpdated = {
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

module.exports = {
  logger,
  groupBy,
  fromNow,
  between,
  lastUpdated,
};
