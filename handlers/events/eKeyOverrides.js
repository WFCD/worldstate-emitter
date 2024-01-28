import { logger } from '../../utilities/index.js';

/**
 * External mission data retrieved from https://10o.io/kuvalog.json
 * @typedef {Object} ExternalMission
 * @property {Date} activation start time
 * @property {Date} expiry end timer
 * @property {string} node formatted node name with planet
 * @property {string} enemy Enemy on tile
 * @property {string} type Mission type of node
 * @property {boolean} archwing whether or not the tile requires archwing
 * @property {boolean} sharkwing whether or not the tile requires
 *    sumbersible archwing
 */

export const fissures = (fissure) => `fissures.t${fissure.tierNum}.${(fissure.missionType || '').toLowerCase()}`;
export const enemies = (acolyte) => ({
  eventKey: `enemies${acolyte.isDiscovered ? '' : '.departed'}`,
  activation: acolyte.lastDiscoveredAt,
});

/**
 * Parse an arbitration for its key
 * @param {ExternalMission} arbi arbitration data to parse
 * @returns {string}
 */
export const arbitration = (arbi) => {
  if (!arbi?.enemy) return '';

  let k;
  try {
    k = `arbitration.${arbi.enemy.toLowerCase()}.${arbi.type.replace(/\s/g, '').toLowerCase()}`;
  } catch (e) {
    logger.error(`Unable to parse arbitraion: ${JSON.stringify(arbi)}\n${e}`);
  }
  return k;
};

export const events = 'operations';
export const persistentEnemies = 'enemies';
