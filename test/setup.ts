/**
 * Test setup file - runs before all tests
 * Configures global test environment
 */

import { logger } from '../utilities';

// Completely silence the logger by replacing all methods with no-ops
const noop = () => {};
logger.error = noop as never;
logger.warn = noop as never;
logger.info = noop as never;
logger.http = noop as never;
logger.verbose = noop as never;
logger.debug = noop as never;
logger.silly = noop as never;

// Also silence transports
logger.transports.forEach((transport) => {
  transport.silent = true;
});
