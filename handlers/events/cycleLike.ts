import { between, fromNow, lastUpdated } from '@/utilities';

interface CycleLike {
  state: string;
  activation: Date | string | number;
  expiry?: Date | string | number;
}

interface Deps {
  key: string;
  platform: string;
  language: string;
  cycleStart: Date | number;
  data: CycleLike;
}

interface Packet extends Deps {
  id: string;
}

/**
 * CycleData parser
 * @param cycleData - data for parsing all cycles like this
 * @param deps - dependencies for processing
 * @returns Array of packets to emit
 */
export default (cycleData: CycleLike, deps: Deps): Packet[] => {
  const packet: Packet = {
    ...deps,
    data: cycleData,
    id: `${deps.key.replace('Cycle', '')}.${cycleData.state}`,
  };

  const last = new Date(lastUpdated[deps.platform]?.[deps.language] ?? 0);
  const activation = new Date(cycleData.activation);
  const start = new Date(deps.cycleStart);

  const packets: Packet[] = [];
  if (between(last.getTime(), activation.getTime(), start.getTime())) {
    packets.push(packet);
  }

  if (cycleData.expiry) {
    const timePacket: Packet = {
      ...packet,
      id: `${packet.id}.${Math.round(fromNow(cycleData.expiry.toString()) / 60000)}`,
    };
    packets.push(timePacket);
  }
  return packets;
};
