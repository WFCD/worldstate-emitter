import type { ExternalMission } from 'warframe-worldstate-parser';
import objectLike from '@/handlers/events/objectLike';
import type { EventPacket } from '@/handlers/events/types';
import { groupBy, logger } from '@/utilities';

interface KuvaDeps {
  key: string;
  platform: string;
  language: string;
  cycleStart: Date | number;
  data: ExternalMission[];
  id?: string;
  activation?: Date | string | number;
  expiry?: Date | string | number;
}

/**
 * Process kuva fields
 * @param deps - dependencies for processing
 * @param packets - packets to emit
 * @returns object(s) to emit from kuva stuff
 */
export default (deps: KuvaDeps, packets: EventPacket[]): EventPacket[] | undefined => {
  if (!deps.data) {
    logger.error('no kuva data');
    return undefined;
  }
  const data = groupBy(deps.data, 'type');
  if (!data) return undefined;

  for (const type of Object.keys(data)) {
    const typeData: ExternalMission[] = data[type];
    const updatedDeps = {
      ...deps,
      data: typeData[0],
      id: `kuva.${typeData[0].type.replace(/\s/g, '').toLowerCase()}`,
      activation: typeData[0].activation,
      expiry: typeData[0].expiry,
    };
    const p = objectLike(typeData[0], updatedDeps);
    if (p) {
      packets.push(p);
    }
  }
  return packets.filter((p): p is EventPacket => p !== undefined);
};
