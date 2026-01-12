import { EventEmitter } from 'node:events';

import type { CronJob as CronJobType } from 'cron';
import { CronJob } from 'cron';

import { logger } from '@/utilities';

/**
 * Cron-based cache that periodically fetches data from a URL
 */
export default class CronCache extends EventEmitter {
  #url: string;
  #pattern = '0 */10 * * * *'; // default: every 10 minutes
  #job: CronJobType;
  #data: string | undefined = '';
  #updating: Promise<string | undefined> | undefined = undefined;
  #logger = logger;

  /**
   * Create and initialize a CronCache instance
   * @param url - The URL to fetch data from
   * @param pattern - Optional cron pattern for update frequency
   * @returns Initialized CronCache instance
   */
  static async make(url: string, pattern?: string): Promise<CronCache> {
    const cache = new CronCache(url, pattern);
    await cache.#update();
    return cache;
  }

  /**
   * Create a new CronCache
   * @param url - The URL to fetch data from
   * @param pattern - Optional cron pattern for update frequency
   */
  constructor(url: string, pattern?: string) {
    super();
    this.#url = url;
    if (pattern) this.#pattern = pattern;
    this.#job = new CronJob(this.#pattern, () => void this.#update(), undefined, true);
    this.#job.start();
  }

  /**
   * Update the cached data by fetching from the URL
   * @private
   */
  async #update(): Promise<string | undefined> {
    this.#updating = this.#fetch();
    this.#logger.debug(`update starting  for ${this.#url}`);
    let error: unknown;
    try {
      this.#data = await this.#updating;
      return this.#updating;
    } catch (e) {
      this.#data = undefined;
      error = e;
    } finally {
      if (this.#data) {
        this.emit('update', this.#data);
        this.#logger.debug(`update done for ${this.#url}`);
      } else {
        this.#logger.debug(`update failed for ${this.#url} : ${error}`);
      }
      this.#updating = undefined;
    }
    return undefined;
  }

  /**
   * Fetch data from the configured URL
   * @private
   */
  async #fetch(): Promise<string> {
    logger.silly(`fetching... ${this.#url}`);
    const response = await fetch(this.#url);

    if (!response.ok) {
      const responseText = await response.text();
      const errorMessage = `Failed to fetch ${this.#url}: ${response.status} ${response.statusText}`;
      logger.error(errorMessage, { responseText });
      throw new Error(errorMessage);
    }

    this.#data = await response.text();
    return this.#data;
  }

  /**
   * Get the cached data, optionally waiting for an in-progress update
   * @returns The cached data
   */
  async get(): Promise<string | undefined> {
    if (this.#updating) {
      logger.silly('returning in-progress update promise');
      return this.#updating;
    }
    if (!this.#data) {
      logger.silly('returning new update promise');
      return this.#update();
    }
    logger.silly('returning cached data');
    return this.#data;
  }

  /**
   * Stop the cron job and cleanup
   */
  stop(): void {
    this.#job.stop();
    this.#logger.debug(`Cron job stopped for ${this.#url}`);
  }
}
