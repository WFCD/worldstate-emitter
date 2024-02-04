import { EventEmitter } from 'node:events';
import { CronJob } from 'cron';
import { logger } from './index.js';

export default class CronCache extends EventEmitter {
  #url = undefined;
  #pattern = '0 */10 * * * *'; // default: every 10 minutes
  #job /** @type {CronJob} */ = undefined;
  /** @type string */ #data = '';
  #updating = undefined;
  #logger = logger;

  static async make(url, pattern) {
    const cache = new CronCache(url, pattern);
    await cache.#update();
    return cache;
  }

  constructor(/** @type string */ url, /** @type string */ pattern) {
    super();
    this.#url = url;
    if (pattern) this.#pattern = pattern;
    this.#job = new CronJob(this.#pattern, this.#update.bind(this), undefined, true);
    this.#job.start();
  }

  async #update() {
    this.#updating = this.#fetch();
    this.#logger.debug(`update starting  for ${this.#url}`);
    try {
      this.#data = await this.#updating;
      return this.#updating;
    } finally {
      this.emit('update', this.#data);
      this.#logger.debug(`update done for ${this.#url}`);
      this.#updating = undefined;
    }
  }

  async #fetch() {
    logger.silly(`fetching... ${this.#url}`);
    const updated = await fetch(this.#url);
    this.#data = await updated.text();
    return this.#data;
  }

  async get() {
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
}
