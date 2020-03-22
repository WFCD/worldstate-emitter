'use strict';

const EventEmitter = require('events');

const RSS = require('./handlers/RSS');
const Worldstate = require('./handlers/Worldstate');
const Twitter = require('./handlers/Twitter');

const { logger } = require('./utilities');

class WorldstateEmitter extends EventEmitter {
  /**
   * Pull in and instantiate emitters
   * @param {string} platform platform to restrict events to
   */
  constructor({ platform, locale } = { platform: undefined, locale: undefined }) {
    super();

    this.platform = platform;
    this.locale = locale;

    this.rss = new RSS(this);
    this.worldstate = new Worldstate(this, platform, locale);
    this.twitter = new Twitter(this);

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
    this.on('ws:update:event', (body) => logger.silly(`emitted event: ${body.id} ${body.platform} in ${body.language}`));
    this.on('tweet', (body) => logger.silly(`emitted: ${body.id}`));
  }

  /**
   * Get current rss feed items
   * @returns {Object} [description]
   */
  getRss() {
    return this.rss.feeder.list.map((i) => ({ url: i.url, items: i.items }));
  }

  /**
   * Get a specific worldstate, defaulting to 'pc' for the platform and 'en' for the language
   * @param  {string} [platform='pc'] platform to get
   * @param  {string} [language='en']   locale/languate to fetch
   * @returns {Object}                 Requested worldstate
   */
  getWorldstate(platform = 'pc', language = 'en') {
    return this.worldstate.get(platform, language);
  }

  /**
   * Get Twitter data
   * @returns {Promise} promised twitter data
   */
  async getTwitter() {
    return this.twitter.clientInfoValid ? this.twitter.getData() : undefined;
  }
}

module.exports = WorldstateEmitter;
