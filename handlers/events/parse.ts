import arrayLike from '@/handlers/events/arrayLike';
import checkOverrides from '@/handlers/events/checkOverrides';
import cycleLike from '@/handlers/events/cycleLike';
import * as eKeyOverrides from '@/handlers/events/eKeyOverrides';
import kuvaProcessing from '@/handlers/events/kuva';
import nightwave from '@/handlers/events/nightwave';
import objectLike from '@/handlers/events/objectLike';
import type {
  ArrayEventDeps,
  BaseEventData,
  CycleLike,
  EventDeps,
  EventPacket,
  KuvaData,
} from '@/handlers/events/types';
import { lastUpdated } from '@/utilities/index';

interface ParseDeps {
  key: string;
  platform: string;
  language: string;
  cycleStart: Date | number;
  data: BaseEventData | BaseEventData[];
  id?: string;
}

/**
 * Set up current cycle start if it's not been initiated
 * @param deps - dependencies for processing
 */
const initCycleStart = (deps: ParseDeps): void => {
  if (!lastUpdated[deps.platform][deps.language]) {
    lastUpdated[deps.platform][deps.language] =
      typeof deps.cycleStart === 'number' ? deps.cycleStart : deps.cycleStart.getTime();
  }
};

/**
 * Parse new events from the provided worldstate
 * @param deps - dependencies to parse out events
 * @returns packet(s) to emit
 */
export default (deps: ParseDeps): EventPacket[] | undefined => {
  initCycleStart(deps);

  const packets: EventPacket[] = [];

  switch (deps.key) {
    case 'kuva': {
      const kuvaData = (Array.isArray(deps.data) ? deps.data : [deps.data]) as KuvaData[];
      return kuvaProcessing({ ...deps, data: kuvaData }, packets);
    }

    case 'events': {
      const eventsOverride = (eKeyOverrides as { events?: string }).events;
      const arrayData = Array.isArray(deps.data) ? deps.data : [deps.data];
      const updatedDeps: ArrayEventDeps = {
        ...deps,
        data: arrayData,
        id: eventsOverride,
      };
      packets.push(...arrayLike(updatedDeps, packets));
      break;
    }

    case 'alerts':
    case 'conclaveChallenges':
    case 'dailyDeals':
    case 'flashSales':
    case 'fissures':
    case 'globalUpgrades':
    case 'invasions':
    case 'syndicateMissions':
    case 'weeklyChallenges': {
      const arrayData = Array.isArray(deps.data) ? deps.data : [deps.data];
      const arrayDeps: ArrayEventDeps = { ...deps, data: arrayData };
      packets.push(...arrayLike(arrayDeps, packets));
      break;
    }

    case 'cetusCycle':
    case 'earthCycle':
    case 'vallisCycle': {
      const singleData = (Array.isArray(deps.data) ? deps.data[0] : deps.data) as CycleLike;
      const cycleDeps = { ...deps, data: singleData };
      const cyclePackets = cycleLike(singleData, cycleDeps);
      packets.push(...(cyclePackets as EventPacket[]));
      break;
    }

    case 'persistentEnemies': {
      const singleData = Array.isArray(deps.data) ? deps.data[0] : deps.data;
      const overrides = checkOverrides(deps.key, singleData);
      const eventDeps: EventDeps = {
        ...deps,
        data: singleData,
        ...(typeof overrides === 'object' ? overrides : {}),
        id: typeof overrides === 'string' ? overrides : overrides.eventKey,
      };
      const packet = objectLike(singleData, eventDeps);
      if (packet) {
        packets.push(packet);
      }
      break;
    }

    case 'sortie':
    case 'voidTrader':
    case 'arbitration':
    case 'sentientOutposts': {
      const singleData = Array.isArray(deps.data) ? deps.data[0] : deps.data;
      const override = checkOverrides(deps.key, singleData);
      const eventDeps: EventDeps = {
        ...deps,
        data: singleData,
        id: typeof override === 'string' ? override : override.eventKey,
      };
      const packet = objectLike(singleData, eventDeps);
      if (packet) {
        packets.push(packet);
      }
      break;
    }

    case 'nightwave': {
      const singleData = Array.isArray(deps.data) ? deps.data[0] : deps.data;
      const nightwaveDeps = { ...deps, data: singleData };
      const nightwavePackets = nightwave(singleData, nightwaveDeps);
      packets.push(...nightwavePackets);
      break;
    }

    default:
      break;
  }

  return packets;
};
