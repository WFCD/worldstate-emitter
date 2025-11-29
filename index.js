import EventEmitter from 'node:events';

import RSS from './handlers/RSS.js';
import Worldstate from './handlers/Worldstate.js';
import Twitter from './handlers/Twitter.js';
import { logger } from './utilities/index.js';
import { FEATURES } from './resources/config.js';

export default class WorldstateEmitter extends EventEmitter {
  #locale;
  #worldstate;
  #twitter;
  #rss;

  static async make({ locale, features } = { locale: undefined, features: [] }) {
    const emitter = new WorldstateEmitter({ locale });
    await emitter.#init(features?.length ? features : FEATURES);
    return emitter;
  }

  /**
   * Pull in and instantiate emitters
   * @param {string} locale language to restrict events to
   */
  constructor({ locale } = { locale: undefined }) {
    super();
    this.#locale = locale;
  }

  async #init(/** @type {string[]} */ features) {
    if (features.includes('rss')) {
      this.#rss = new RSS(this);
    }
    if (features.includes('worldstate')) {
      this.#worldstate = new Worldstate(this, this.#locale);
      await this.#worldstate.init();
    }
    if (features.includes('twitter')) {
      this.#twitter = new Twitter(this);
    }

    logger.silly('hey look, i started up...');
    this.setupLogging();
  }

  /**
   * Set up internal logging
   * @private
   */
  setupLogging() {
    this.on('error', logger.error);

    this.on('rss', (body) => logger.silly(`emitted: ${body.id}`));
    this.on('ws:update:raw', (body) => logger.silly(`emitted raw: ${body.platform}`));
    this.on('ws:update:parsed', (body) => logger.silly(`emitted parsed: ${body.platform} in ${body.language}`));
    this.on('ws:update:event', (body) =>
      logger.silly(`emitted event: ${body.id} ${body.platform} in ${body.language}`)
    );
    this.on('tweet', (body) => logger.silly(`emitted: ${body.id}`));
  }

  /**
   * Get current rss feed items
   * @returns {Object} [description]
   */
  getRss() {
    if (!this.#rss) return undefined;
    return this.#rss.feeder.list.map((i) => ({ url: i.url, items: i.items }));
  }

  /**
   * Get a specific worldstate, defaulting to 'pc' for the platform and 'en' for the language
   * @param  {string} [language='en']   locale/languate to fetch
   * @returns {Object}                 Requested worldstate
   */
  getWorldstate(language = 'en') {
    if (!this.#worldstate) return undefined;
    return this.#worldstate?.get(language);
  }

  get debug() {
    return {
      rss: FEATURES.includes('rss') ? this.getRss() : undefined,
      worldstate: FEATURES.includes('worldstate') ? this.#worldstate?.get() : undefined,
      twitter: this.#twitter?.clientInfoValid ? this.#twitter.getData() : undefined,
    };
  }

  /**
   * Get Twitter data
   * @returns {Promise} promised twitter data
   */
  async getTwitter() {
    return this.#twitter?.clientInfoValid ? this.twitter.getData() : undefined;
  }
}
