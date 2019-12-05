'use strict';

const { between, lastUpdated, logger } = require('../../utilities');

module.exports = (data, deps) => {
  if (!data) return undefined;
  const last = new Date(lastUpdated[deps.platform][deps.language]);
  const activation = new Date(data.activation);
  const start = new Date(deps.cycleStart);
  if (between(last, activation, start)) {
    const p = {
      ...deps,
      data,
      id: deps.id || deps.key,
    };
    if (deps.key === 'kuva') logger.warn(`objectlike: ${JSON.stringify(p)}`);
  }
  return undefined;
};
