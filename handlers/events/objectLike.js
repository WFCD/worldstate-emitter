'use strict';

const { between, lastUpdated } = require('../../utilities');

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
    return p;
  }
  return undefined;
};
