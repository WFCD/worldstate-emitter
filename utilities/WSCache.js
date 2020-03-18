'use strict';

const Worldstate = require('warframe-worldstate-parser');

/**
 * Warframe WorldState Cache - store and retrieve current worldstate data
 */
class WSCache {
  /**
   * Set up a cache checking for data and updates to a specific worldstate set
   * @param {string}        platform      Platform to track
   * @param {string}        language      Langauge/translation to track
   * @param {JSONCache}     kuvaCache     Cache of kuva data, provided by Semlar
   * @param {JSONCache}     sentientCache Cache of sentient outpost data, provided by Semlar
   * @param {Eventemitter}  eventEmitter  Emitter to push new worldstate updates to
   */
  constructor({
    platform, language, kuvaCache, sentientCache, eventEmitter,
  }) {
    this.inner = null;
    Object.defineProperty(this, 'inner', { enumerable: false, configurable: false });

    this.kuvaCache = kuvaCache;
    Object.defineProperty(this, 'kuvaCache', { enumerable: false, configurable: false });

    this.sentientCache = sentientCache;
    Object.defineProperty(this, 'sentientCache', { enumerable: false, configurable: false });

    this.platform = platform;
    this.language = language;

    this.emitter = eventEmitter;
  }

  /**
   * Get the latest worldstate data from this cache
   * @returns {Object} Current worldstate data
   */
  get data() {
    return this.inner;
  }

  /**
   * Set the current data, aslso parses and emits data
   * @param  {string} newData New string data to parse
   */
  set data(newData) {
    setTimeout(async () => {
      const t = new Worldstate(newData, {
        locale: this.language,
        kuvaData: await this.kuvaCache.getData(),
        sentientData: await this.sentientCache.getData(),
      });
      if (!t.timestamp) return;

      this.inner = t;
      this.emitter.emit('ws:update:parsed', { language: this.language, platform: this.platform, data: this.inner });
    }, 1000);
  }

  /**
   * Set the current twitter data for the worldstate
   * @param  {Object} newTwitter twitter data
   */
  set twitter(newTwitter) {
    if (!(newTwitter && newTwitter.length)) return;
    this.inner.twitter = newTwitter;
  }
}

module.exports = WSCache;
