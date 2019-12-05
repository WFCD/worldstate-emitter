'use strict';

const Cache = require('json-fetch-cache');
const { locales } = require('warframe-worldstate-data');

const WSCache = require('../utilities/WSCache');

const { logger, groupBy, lastUpdated } = require('../utilities');

const platforms = ['pc', 'ps4', 'xb1', 'swi'];
const worldStates = {};
const kuvaCache = new Cache('https://10o.io/kuvalog.json', 300000, {
  useEmitter: false, logger, delayStart: false, maxRetry: 1,
});

const fissureKey = (fissure) => `fissures.t${fissure.tierNum}.${(fissure.missionType || '').toLowerCase()}`;
const acolyteKey = (acolyte) => ({
  eventKey: `enemies${acolyte.isDiscovered ? '' : '.departed'}`,
  activation: acolyte.lastDiscoveredAt,
});
const arbiKey = (arbitration) => {
  if (!(arbitration && arbitration.enemy)) return '';

  let k;
  try {
    k = `arbitration.${arbitration.enemy.toLowerCase()}.${arbitration.type.replace(/\s/g, '').toLowerCase()}`;
  } catch (e) {
    logger.error(`Unable to parse arbitraion: ${JSON.stringify(arbitration)}\n${e}`);
  }
  return k;
};

const eKeyOverrides = {
  events: 'operations',
  persistentEnemies: 'enemies',
  fissures: fissureKey,
  enemies: acolyteKey,
  arbitration: arbiKey,
};

/**
 * Find overrides for the provided key
 * @param  {string} key  worldsate field to find overrides
 * @param  {Object} data data corresponding to the key from provided worldstate
 * @returns {string}      overrided key
 */
const checkOverrides = (key, data) => {
  if (typeof eKeyOverrides[key] === 'string') {
    return eKeyOverrides[key];
  }
  if (typeof eKeyOverrides[key] === 'function') {
    return eKeyOverrides[key](data);
  }
  return key;
};

/**
 * Parse new events from the provided worldstate
 * @param  {Object} deps dependencies to parse out events
 * @returns {Packet|Packet[]}      packet(s) to emit
 */
const parseNew = (deps) => {
  if (!lastUpdated[deps.platform][deps.language]) {
    lastUpdated[deps.platform][deps.language] = deps.cycleStart;
  }

  // anything in the eKeyOverrides goes first, then anything uniform
  const packets = [];
  switch (deps.key) {
    case 'kuva':
      if (!deps.data) {
        logger.error('no kuva data');
        return undefined;
      }
      const data = groupBy(deps.data, 'type');
      Object.keys(data).forEach((type) => {
        deps = {
          ...deps,
          data: data[type],
          id: `kuva.${data[type][0].type.replace(/\s/g, '').toLowerCase()}`,
          activation: data[type][0].activation,
          expiry: data[type][0].expiry,
        };
        const p = require('./events/objectLike')(deps.data, deps);
        if (p) {
          packets.push(p);
        }
      });
      return packets.filter((p) => p);
    case 'events':
      deps = {
        ...deps,
        id: eKeyOverrides[deps.key],
      };
    case 'alerts':
    case 'conclaveChallenges':
    case 'dailyDeals':
    case 'flashSales':
    case 'fissures':
    case 'globalUpgrades':
    case 'invasions':
    case 'syndicateMissions':
    case 'weeklyChallenges':
      // arrayLike are all just arrays of objectLike
      deps.data.forEach((arrayItem) => {
        const k = checkOverrides(deps.key, arrayItem);
        packets.push(require('./events/objectLike')(arrayItem, {
          ...deps,
          id: k,
        }));
      });
      return packets;
    case 'cetusCycle':
    case 'earthCycle':
    case 'vallisCycle':
      // these need special logic to make sure the extra time events fire
      return require('./events/cycleLike')(deps.data, deps);
    case 'sortie':
    case 'voidTrader':
    case 'arbitration':
      // pretty straightforward, make sure the activation
      //    is between the last update and current cycle start
      deps.id = checkOverrides(deps.key, deps.data);
      return require('./events/objectLike')(deps.data, deps);
    case 'nightwave':
      return require('./events/nightwave')(deps.data, deps);
    case 'persistentEnemies':
      // uhhh, gotta find a good activation for this....
      // might just have to send it all the time?
      deps = {
        ...deps,
        ...checkOverrides(deps.key, deps.data),
      };
      return require('./events/objectLike')(deps.data, deps);
    default:
      return packets;
  }
};

const wsTimeout = process.env.CACHE_TIMEOUT || 60000;
const wsRawCaches = {};

const debugEvents = ['arbitration', 'kuva', 'nightwave'];

class Worldstate {
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

      const url = `http://content${p === 'pc' ? '' : `.${p}`}.warframe.com/dynamic/worldState.php`;
      worldStates[p] = {};

      locales.forEach((locale) => {
        if (!this.locale || this.locale === locale) {
          worldStates[p][locale] = new WSCache(p, locale, kuvaCache, this.emitter);
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
   * @param  {string} [language='en' }]            langauge of the worldstate
   */
  parseEvents({ worldstate, platform, language = 'en' }) {
    const cycleStart = Date.now();
    const packets = [];
    Object.keys(worldstate).forEach(async (key) => {
      const packet = parseNew({
        data: worldstate[key], key, language, platform, cycleStart,
      });

      if (Array.isArray(packet)) {
        if (packet.length) {
          packets.push(...(packet.filter((p) => p && p !== null)));
        }
      } else if (packet) {
        packets.push(packet);
      }
    });

    lastUpdated[platform][language] = Date.now();
    packets
      .filter((p) => p && p.id && packets !== null)
      .forEach((packet) => {
        this.emit('ws:update:event', packet);
      });
  }

  emit(id, packet) {
    if (debugEvents.includes(packet.key)) logger.warn(packet.key);

    logger.silly(`ws:update:event - emitting ${packet.id}`);
    delete packet.cycleStart;
    delete packet.key;
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
    throw new Error(`Platform (${platform}) or language (${language}) not tracked.\nEnsure that the parameters passed are correct`);
  }
}

module.exports = Worldstate;
