import wsData from 'warframe-worldstate-data';

import WSCache from '../utilities/WSCache.js';
import { logger, lastUpdated } from '../utilities/index.js';
import Cache from '../utilities/Cache.js';
import { SENTIENT_URL, KUVA_URL, WORLDSTATE_URL } from '../resources/config.js';

import parseNew from './events/parse.js';

const { locales } = wsData;

const debugEvents = ['arbitration', 'kuva', 'nightwave'];
const smCron = `0 */10 * * * *`;

/**
 * Handler for worldstate data
 */
export default class Worldstate {
  #emitter;
  #locale;
  #worldStates = {};
  #wsRawCache;
  #kuvaCache;
  #sentientCache;

  /**
   * Set up listening for specific platform and locale if provided.
   * @param {EventEmitter} eventEmitter Emitter to push new worldstate events to
   * @param {string} locale       Locale (actually just language) to watch
   */
  constructor(eventEmitter, locale) {
    this.#emitter = eventEmitter;
    this.#locale = locale;
    logger.debug('starting up worldstate listener...');
    if (locale) {
      logger.debug(`only listening for ${locale}...`);
    }
  }

  async init() {
    this.#wsRawCache = await Cache.make(WORLDSTATE_URL, '*/10 * * * * *');
    this.#kuvaCache = await Cache.make(KUVA_URL, smCron);
    this.#sentientCache = await Cache.make(SENTIENT_URL, smCron);

    await this.setUpRawEmitters();
    this.setupParsedEvents();
  }

  /**
   * Set up emitting raw worldstate data
   */
  async setUpRawEmitters() {
    this.#worldStates = {};

    // eslint-disable-next-line no-restricted-syntax
    for await (const locale of locales) {
      if (!this.#locale || this.#locale === locale) {
        this.#worldStates[locale] = new WSCache({
          language: locale,
          kuvaCache: this.#kuvaCache,
          sentientCache: this.#sentientCache,
          eventEmitter: this.#emitter,
        });
      }
    }

    /* listen for the raw cache updates so we can emit them from the super emitter */
    this.#wsRawCache.on('update', (dataStr) => {
      this.#emitter.emit('ws:update:raw', { platform: 'pc', data: dataStr });
    });

    /* when the raw emits happen, parse them and store them on parsed worldstate caches */
    this.#emitter.on('ws:update:raw', ({ data }) => {
      logger.debug('ws:update:raw - updating locales data');
      locales.forEach((locale) => {
        if (!this.#locale || this.#locale === locale) {
          this.#worldStates[locale].data = data;
        }
      });
    });
  }

  /**
   * Set up listeners for the parsed worldstate updates
   */
  setupParsedEvents() {
    this.#emitter.on('ws:update:parsed', ({ language, platform, data }) => {
      const packet = { platform, worldstate: data, language };
      this.parseEvents(packet);
    });
  }

  /**
   * Parse new worldstate events
   * @param  {Object} worldstate     worldstate to find packets from
   * @param  {string} platform       platform the worldstate corresponds to
   * @param  {string} [language='en'] language of the worldstate (defaults to 'en')
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

    logger.debug(`ws:update:event - emitting ${packet.id}`);
    delete packet.cycleStart;
    this.#emitter.emit(id, packet);
  }

  /**
   * get a specific worldstate version
   * @param  {string} [language='en'] Locale of the worldsttate
   * @returns {Object}                Worldstate corresponding to provided data
   * @throws {Error} when the platform or locale aren't tracked and aren't updated
   */
  get(language = 'en') {
    logger.debug(`getting worldstate ${language}...`);
    if (this.#worldStates?.[language]) {
      return this.#worldStates?.[language]?.data;
    }
    throw new Error(`Language (${language}) not tracked.\nEnsure that the parameters passed are correct`);
  }
}
