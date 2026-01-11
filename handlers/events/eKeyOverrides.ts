import { logger } from '@/utilities/index';

interface ExternalMission {
  activation: Date;
  expiry: Date;
  node: string;
  enemy: string;
  type: string;
  archwing: boolean;
  sharkwing: boolean;
}

interface Fissure {
  tierNum: number;
  missionType?: string;
}

interface Acolyte {
  isDiscovered: boolean;
  lastDiscoveredAt: Date;
}

export const fissures = (fissure: Fissure): string =>
  `fissures.t${fissure.tierNum}.${(fissure.missionType || '').toLowerCase()}`;

export const enemies = (acolyte: Acolyte): { eventKey: string; activation: Date } => ({
  eventKey: `enemies${acolyte.isDiscovered ? '' : '.departed'}`,
  activation: acolyte.lastDiscoveredAt,
});

/**
 * Parse an arbitration for its key
 * @param arbi - arbitration data to parse
 * @returns Event key string
 */
export const arbitration = (arbi: ExternalMission): string => {
  if (!arbi?.enemy) return '';

  let k: string;
  try {
    k = `arbitration.${arbi.enemy.toLowerCase()}.${arbi.type.replace(/\s/g, '').toLowerCase()}`;
  } catch (e) {
    logger.error(`Unable to parse arbitraion: ${JSON.stringify(arbi)}\n${e}`);
    return '';
  }
  return k;
};

export const events = 'operations';
export const persistentEnemies = 'enemies';
