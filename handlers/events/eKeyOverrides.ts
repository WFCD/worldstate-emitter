import type { ExternalMission, Fissure, PersistentEnemy, WorldStateObject } from 'warframe-worldstate-parser';
import type { OverrideFunction, OverrideMap } from '@/handlers/events/types';
import { logger } from '@/utilities';

export const fissures: OverrideFunction = (data: WorldStateObject): string => {
  const fissure = data as Fissure;
  return `fissures.t${fissure.tierNum}.${(fissure.missionType || '').toLowerCase()}`;
};

export const enemies: OverrideFunction = (data: WorldStateObject): { eventKey: string; activation: Date } => {
  const enemy = data as PersistentEnemy;
  return {
    eventKey: `enemies${enemy.isDiscovered ? '' : '.departed'}`,
    activation: new Date(enemy.lastDiscoveredAt),
  };
};

export const arbitration: OverrideFunction = (data: WorldStateObject): string => {
  const arbi = data as unknown as ExternalMission;
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

export const overrides: OverrideMap = {
  fissures,
  enemies,
  arbitration,
  events,
  persistentEnemies,
};
