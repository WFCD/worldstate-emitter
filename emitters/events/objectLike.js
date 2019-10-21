'use strict';

const { between, lastUpdated, logger } = require('../../utilities');

module.exports = (data, deps) => {
  // logger.info(`received ${deps.key}`);

  if (!data) return undefined;
  const last = new Date(lastUpdated[deps.platform][deps.language]);
  const activation = new Date(data.activation);
  const start = new Date(deps.cycleStart - 10000000);

  if (between(last, activation, start)) {
    const packet = {
      ...deps,
      data,
      eventKey: deps.eventKey || deps.key,
    };
    return packet;
  }
  return undefined;
};
