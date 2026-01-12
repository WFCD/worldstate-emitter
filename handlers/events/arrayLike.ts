import checkOverrides from '@/handlers/events/checkOverrides';
import objectLike from '@/handlers/events/objectLike';
import type { ArrayEventDeps, EventPacket } from '@/handlers/events/types';
import { logger } from '@/utilities';

/**
 * arrayLike are all just arrays of objectLike
 * @param deps - dependencies for processing
 * @returns object(s) to emit from arrayLike processing
 */
export default (deps: ArrayEventDeps): EventPacket[] => {
  const newPackets: EventPacket[] = [];
  try {
    for (const arrayItem of deps.data) {
      const k = checkOverrides(deps.key, arrayItem);
      const result = objectLike(arrayItem, {
        ...deps,
        data: arrayItem,
        id: typeof k === 'string' ? k : k.eventKey,
      });
      if (result) {
        newPackets.push(result);
      }
    }
    return newPackets;
  } catch (err) {
    logger.error(err);
    return newPackets;
  }
};
