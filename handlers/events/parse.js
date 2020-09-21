'use strict';

const checkOverrides = require('./checkOverrides');
const kuvaProcessing = require('./kuva');
const arrayLike = require('./arrayLike');
const eKeyOverrides = require('./eKeyOverrides');

const { lastUpdated } = require('../../utilities');

/**
 * Set up current cycle start if it's not been intiated
 * @param  {Object} deps    dependencies for processing
 */
const initCycleStart = (deps) => {
  if (!lastUpdated[deps.platform][deps.language]) {
    lastUpdated[deps.platform][deps.language] = deps.cycleStart;
  }
};

/**
 * Parse new events from the provided worldstate
 * @param  {Object} deps dependencies to parse out events
 * @returns {Packet|Packet[]}      packet(s) to emit
 */
module.exports = (deps) => {
  initCycleStart(deps);

  // anything in the eKeyOverrides goes first, then anything uniform
  const packets = [];
  switch (deps.key) {
    case 'kuva':
      return kuvaProcessing(deps, packets);
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
      packets.push(...arrayLike(deps, packets));
      break;
    case 'cetusCycle':
    case 'earthCycle':
    case 'vallisCycle':
      packets.push(require('./cycleLike')(deps.data, deps));
      break;
    case 'persistentEnemies':
      deps = {
        ...deps,
        ...checkOverrides(deps.key, deps.data),
      };
    case 'sortie':
    case 'voidTrader':
    case 'arbitration':
    case 'sentientOutposts':
      deps.id = checkOverrides(deps.key, deps.data);
      packets.push(require('./objectLike')(deps.data, deps));
    case 'nightwave':
      packets.push(require('./nightwave')(deps.data, deps));
    default:
      break;
  }

  return packets;
};
