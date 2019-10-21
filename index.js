'use strict';

const EventEmitter = require('events');

const { logger, worldStates } = require('./utilities');

class WorldstateEmitter extends EventEmitter {
  /**
   * Pull in and instantiate emitters
   */
  constructor() {
    super();

    this.rss = require('./emitters/RSS');
    this.worldstate = require('./emitters/Worldstate');
    this.twitter = require('./emitters/Twitter');
    this.setupEmissions();
    logger.verbose('hey look, i started up...');
    this.setupLogging();
  }

  /**
   * Set up internal logging
   * @private
   */
  setupLogging() {
    this.on('rss', (body) => logger.debug(`emitted: ${body.key}`));
    this.on('ws:update', (body) => logger.debug(`emitted: ${body.eventKey}`));
    this.on('tweet', (body) => logger.debug(`emitted: ${body.id}`));
  }

  /**
   * Set up routing from internal emitters to external emissions
   * @private
   */
  setupEmissions() {
    this.rss.on('rss', (body) => this.emit('rss', body));
    this.twitter.on('tweet', (tweet) => this.emit('tweet', tweet));
    this.worldstate.on('update', (packet) => this.emit('ws:update', packet));
  }

  /**
   * Get current rss feed items
   * @return {Object} [description]
   */
  getRss() {
    return this.rss.feeder.list().map((i) => ({ url: i.url, items: i.items }));
  }

  /**
   * Get a specific worldstate, defaulting to 'pc' for the platform and 'en' for the language
   * @param  {String} [platform='pc'] platform to get
   * @param  {String} [locale='en']   locale/languate to fetch
   * @return {[type]}                 [description]
   */
  // eslint-disable-next-line class-methods-use-this
  getWorldstate(platform = 'pc', locale = 'en') {
    return worldStates[platform][locale].data;
  }

  /**
   * Get Twitter data
   * @return {Promise} promised twitter data
   */
  async getTwitter() {
    return this.twitter.getData();
  }
}

module.exports = WorldstateEmitter;
