import type { BaseEventData, EventDeps, EventPacket } from '@/handlers/events/types';
import { between, lastUpdated } from '@/utilities/index';

/**
 * Process object-like worldstate events
 * @param data - Event data
 * @param deps - Dependencies for processing
 * @returns Packet to emit or undefined
 */
export default (data: BaseEventData, deps: EventDeps): EventPacket | undefined => {
  if (!data) return undefined;
  const last = new Date(lastUpdated[deps.platform][deps.language]);
  const activation = new Date(data.activation);
  const start = new Date(deps.cycleStart);
  if (between(last.getTime(), activation.getTime(), start.getTime())) {
    const p: EventPacket = {
      ...deps,
      data,
      id: deps.id || deps.key,
    };
    return p;
  }
  return undefined;
};
