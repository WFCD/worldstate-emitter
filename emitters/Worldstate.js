'use strict';

const EventEmitter = require('events');
const {
  worldStates, logger, groupBy, warframeData: { locales }, lastUpdated,
} = require('../utilities');

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
      if (!deps.data) break;
      const data = groupBy(deps.data, 'type');
      Object.keys(data).forEach((type) => {
        deps = {
          ...deps,
          data: data[type],
          eventKey: `kuva.${data[type][0].type.replace(/\s/g, '').toLowerCase()}`,
        };
        packets.push(require('./events/objectLike')(deps.data, deps));
      });
      return packets;
    case 'events':
      deps = {
        ...deps,
        eventKey: eKeyOverrides[deps.key],
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
          eventKey: k,
        }));
      });
      return packets;
    case 'cetusCycle':
    case 'earthCycle':
    case 'vallisCycle':
      // these need special logic to make sure the extra time events fire
      require('./events/cycleLike')(deps.data, deps);
      break;
    case 'sortie':
    case 'voidTrader':
    case 'arbitration':
      // pretty straightforward, make sure the activation
      //    is between the last update and current cycle start
      deps.eventKey = checkOverrides(deps.key, deps.data);
      require('./events/objectLike')(deps.data, deps);
      break;
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
      return undefined;
  }
  return undefined;
};

class Worldstate extends EventEmitter {
  constructor() {
    super();
    Object.keys(worldStates)
      .forEach((platform) => {
        locales.forEach((locale) => {
          worldStates[platform][locale].on('update', (data) => {
            const packet = { platform, worldstate: data, language: locale };
            this.parseEvents(packet);
          });
        });
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
        packets.push(...packet);
      } else {
        packets.push(packet);
      }
    });

    lastUpdated[platform][language] = Date.now();

    packets
      .filter((p) => p && p.eventKey)
      .forEach((packet) => {
        this.emit('update', packet);
      });
  }
}

module.exports = new Worldstate();
