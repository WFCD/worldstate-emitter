'use strict';

const Cache = require('json-fetch-cache');
const { locales } = require('warframe-worldstate-data');

const WSCache = require('../utilities/WSCache');

const { logger, lastUpdated } = require('../utilities');

const parseNew = require('./events/parse');

const wsTimeout = process.env.CACHE_TIMEOUT || 60000;
const platforms = ['pc', 'ps4', 'xb1', 'swi'];
const worldStates = {};
const wsRawCaches = {};

const debugEvents = ['arbitration', 'kuva', 'nightwave'];
const smTimeout = process.env.SEMLAR_TIMEOUT || 300000;
const kuvaCache = new Cache('https://10o.io/arbitrations.json', smTimeout, { logger, maxRetry: 0 });
const sentientCache = new Cache('https://semlar.com/anomaly.json', smTimeout, { logger });

/**
 * Handler for worldstate data
 */
class Worldstate {
  /**
   * Set up listening for specific platform and locale if provided.
   * @param {EventEmitter} eventEmitter Emitter to push new worldstate events to
   * @param {string} platform     Platform to watch (optional)
   * @param {string} locale       Locale (actually just language) to watch
   */
  constructor(eventEmitter, platform, locale) {
    this.emitter = eventEmitter;
    this.platform = platform;
    this.locale = locale;
    logger.silly('starting up worldstate listener...');
    if (platform) {
      logger.debug(`only listening for ${platform}...`);
    }
    if (locale) {
      logger.debug(`only listening for ${locale}...`);
    }

    this.setUpRawEmitters();
    this.setupParsedEvents();
  }

  /**
   * Set up emitting raw worldstate data
   */
  setUpRawEmitters() {
    platforms.forEach((p) => {
      if (this.platform && this.platform !== p) return;

      const url = `https://content${p === 'pc' ? '' : `.${p}`}.warframe.com/dynamic/worldState.php`;
      worldStates[p] = {};

      locales.forEach(async (locale) => {
        if (!this.locale || this.locale === locale) {
          worldStates[p][locale] = new WSCache({
            platform: p,
            language: locale,
            kuvaCache,
            sentientCache,
            eventEmitter: this.emitter,
          });
        }
      });

      wsRawCaches[p] = new Cache(url, wsTimeout, {
        delayStart: false,
        parser: (str) => str,
        useEmitter: true,
        logger,
      });

      /* listen for the raw cache updates so we can emit them from the super emitter */
      wsRawCaches[p].on('update', (dataStr) => {
        this.emitter.emit('ws:update:raw', { platform: p, data: dataStr });
      });
    });

    /* when the raw emits happen, parse them and store them on parsed worldstate caches */
    this.emitter.on('ws:update:raw', ({ platform, data }) => {
      locales.forEach((locale) => {
        if (!this.locale || this.locale === locale) {
          worldStates[platform][locale].data = data;
        }
      });
    });
  }

  /**
   * Set up listeners for the parsed worldstate updates
   */
  setupParsedEvents() {
    this.emitter.on('ws:update:parsed', ({ language, platform, data }) => {
      const packet = { platform, worldstate: data, language };
      this.parseEvents(packet, this.emitter);
    });
  }

  /**
   * Parse new worldstate events
   * @param  {Object} worldstate     worldstate to find packets from
   * @param  {string} platform       platform the worldstate corresponds to
   * @param  {string} [language='en'] langauge of the worldstate (defaults to 'en')
   */
  parseEvents({ worldstate, platform, language = 'en' }) {
    const cycleStart = Date.now();
    const packets = [];
    Object.keys(worldstate).forEach(async (key) => {
      if (worldstate && worldstate[key]) {
        const packet = parseNew({
          data: worldstate[key],
          key,
          language,
          platform,
          cycleStart,
        });

        if (Array.isArray(packet)) {
          if (packet.length) {
            packets.push(...packet.filter((p) => p && p));
          }
        } else if (packet) {
          packets.push(packet);
        }
      }
    });

    lastUpdated[platform][language] = Date.now();
    packets
      .filter((p) => p && p.id && packets)
      .forEach((packet) => {
        this.emit('ws:update:event', packet);
      });
  }

  /**
   * Emit an event with given id
   * @param  {string} id     Id of the event to emit
   * @param  {Object} packet Data packet to emit
   */
  emit(id, packet) {
    if (debugEvents.includes(packet.key)) logger.warn(packet.key);

    logger.silly(`ws:update:event - emitting ${packet.id}`);
    delete packet.cycleStart;
    this.emitter.emit(id, packet);
  }

  /**
   * get a specific worldstate version
   * @param  {string} [platform='pc'] Platform of the worldstate
   * @param  {string} [locale='en']   Locale of the worldsttate
   * @returns {Object}                 Worldstate corresponding to provided data
   * @throws {Error} when the platform or locale aren't tracked and aren't updated
   */
  // eslint-disable-next-line class-methods-use-this
  get(platform = 'pc', language = 'en') {
    if (worldStates[platform] && worldStates[platform][language]) {
      return worldStates[platform][language].data;
    }
    throw new Error(
      `Platform (${platform}) or language (${language}) not tracked.\nEnsure that the parameters passed are correct`
    );
  }
}

module.exports = Worldstate;
