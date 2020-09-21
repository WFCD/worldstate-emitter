'use strict';

const { logger } = require('../../utilities');

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

module.exports = {
  events: 'operations',
  persistentEnemies: 'enemies',
  fissures: fissureKey,
  enemies: acolyteKey,
  arbitration: arbiKey,
};
