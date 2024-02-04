import { between, lastUpdated, fromNow } from '../../utilities/index.js';

/**
 * @typedef {Object} CycleLike
 * @property {string} state
 * @property {string} key
 * @property {Date} activation
 */

/**
 * CylceData parser
 * @param {CycleLike} cycleData data for parsing all cycles like this
 * @param {Deps} deps dependencies for processing
 * @returns {Object[]}
 */
export default (cycleData, deps) => {
  const packet = {
    ...deps,
    data: cycleData,
    id: `${deps.key.replace('Cycle', '')}.${cycleData.state}`,
  };

  const last = new Date(lastUpdated[deps.platform][deps.language]);
  const activation = new Date(cycleData.activation);
  const start = new Date(deps.cycleStart);

  const packets = [];
  if (between(last, activation, start)) {
    packets.push(packet);
  }

  const timePacket = {
    ...packet,
    id: `${packet.id}.${Math.round(fromNow(deps.data.expiry) / 60000)}`,
  };
  packets.push(timePacket);
  return packets;
};
