import Worldstate from 'warframe-worldstate-parser';

import { logger } from './index.js';

/**
 * Warframe WorldState Cache - store and retrieve current worldstate data
 */
export default class WSCache {
  #inner;
  #kuvaCache;
  #sentientCache;
  #logger = logger;
  #emitter;
  /** @type string */ #platform = 'pc';
  /** @type string */ #language;

  /**
   * Set up a cache checking for data and updates to a specific worldstate set
   * @param {string}        language      Langauge/translation to track
   * @param {Cache}     kuvaCache     Cache of kuva data, provided by Semlar
   * @param {Cache}     sentientCache Cache of sentient outpost data, provided by Semlar
   * @param {EventEmitter}  eventEmitter  Emitter to push new worldstate updates to
   */
  constructor({ language, kuvaCache, sentientCache, eventEmitter }) {
    this.#inner = undefined;
    this.#kuvaCache = kuvaCache;
    this.#sentientCache = sentientCache;
    this.#language = language;
    this.#emitter = eventEmitter;
  }

  /**
   * Get the latest worldstate data from this cache
   * @returns {Object} Current worldstate data
   */
  get data() {
    return this.#inner;
  }

  /**
   * Set the current data, aslso parses and emits data
   * @param  {string} newData New string data to parse
   */
  set data(newData) {
    logger.debug(`got new data for ${this.#language}, parsing...`);
    setTimeout(async () => {
      const t = new Worldstate(newData, {
        locale: this.#language,
        kuvaData: JSON.parse(await this.#kuvaCache.get()),
        sentientData: JSON.parse(await this.#sentientCache.get()),
      });
      if (!t.timestamp) return;

      this.#inner = t;
      this.#emitter.emit('ws:update:parsed', {
        language: this.#language,
        platform: this.#platform,
        data: t,
      });
    }, 0);
  }

  /**
   * Set the current twitter data for the worldstate
   * @param  {Object} newTwitter twitter data
   */
  set twitter(newTwitter) {
    if (!(newTwitter && newTwitter.length)) return;
    this.#inner.twitter = newTwitter;
  }
}
