'use strict';

const { between, lastUpdated, fromNow } = require('../../utilities');

module.exports = (cycleData, deps) => {
  const packet = {
    ...deps,
    data: cycleData,
    eventKey: `${deps.key.replace('Cycle', '')}.${cycleData.state}`,
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
    eventKey: `${packet.eventKey}.${Math.round(fromNow(deps.data.expiry) / 60000)}`,
  };
  packets.push(timePacket);
  return packets;
};
