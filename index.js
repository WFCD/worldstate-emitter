'use strict';

const EventEmitter = require('events');

const RSS = require('./handlers/RSS');
const Worldstate = require('./handlers/Worldstate');
const Twitter = require('./handlers/Twitter');

const { logger, worldStates } = require('./utilities');

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

    logger.verbose('hey look, i started up...');
    this.setupLogging();
  }

  /**
   * Set up internal logging
   * @private
   */
  setupLogging() {
    this.on('rss', (body) => logger.verbose(`emitted: ${body.id}`));
    this.on('ws:update:raw', (body) => logger.debug(`emitted raw: ${body.platform}`));
    this.on('ws:update:parsed', (body) => logger.debug(`emitted parsed: ${body.platform} in ${body.language}`));
    this.on('ws:update:event', (body) => logger.debug(`emitted event: ${body.id} ${body.platform} in ${body.language}`));
    this.on('tweet', (body) => logger.debug(`emitted: ${body.id}`));
  }

  /**
   * Get current rss feed items
   * @returns {Object} [description]
   */
  getRss() {
    return this.rss.feeder.list().map((i) => ({ url: i.url, items: i.items }));
  }

  /**
   * Get a specific worldstate, defaulting to 'pc' for the platform and 'en' for the language
   * @param  {String} [platform='pc'] platform to get
   * @param  {String} [locale='en']   locale/languate to fetch
   * @returns {Object}                 Requested worldstate
   */
  // eslint-disable-next-line class-methods-use-this
  getWorldstate(platform = 'pc', locale = 'en') {
    if (worldStates[platform] && worldStates[platform][locale]) {
      return worldStates[platform][locale].data;
    }
    throw new Error(`Platform (${platform}) or locale (${locale}) not tracked.\nEnsure that the parameters passed are correct`);
  }

  /**
   * Get Twitter data
   * @returns {Promise} promised twitter data
   */
  async getTwitter() {
    return this.twitter.getData();
  }
}

module.exports = WorldstateEmitter;
