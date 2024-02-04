import EventEmitter from 'node:events';

import RSS from './handlers/RSS.js';
import Worldstate from './handlers/Worldstate.js';
import Twitter from './handlers/Twitter.js';

import { logger } from './utilities/index.js';

export default class WorldstateEmitter extends EventEmitter {
  #locale;
  #worldstate;
  #twitter;
  #rss;

  static async make({ locale } = { locale: undefined }) {
    const emitter = new WorldstateEmitter({ locale });
    await emitter.#init();
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

  async #init() {
    this.#rss = new RSS(this);
    this.#worldstate = new Worldstate(this, this.#locale);
    await this.#worldstate.init();
    this.#twitter = new Twitter(this);

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
    return this.#rss.feeder.list.map((i) => ({ url: i.url, items: i.items }));
  }

  /**
   * Get a specific worldstate, defaulting to 'pc' for the platform and 'en' for the language
   * @param  {string} [language='en']   locale/languate to fetch
   * @returns {Object}                 Requested worldstate
   */
  getWorldstate(language = 'en') {
    return this.#worldstate?.get(language);
  }

  /**
   * Get Twitter data
   * @returns {Promise} promised twitter data
   */
  async getTwitter() {
    return this.#twitter?.clientInfoValid ? this.twitter.getData() : undefined;
  }
}
