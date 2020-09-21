'use strict';

const { logger, groupBy } = require('../../utilities');

/**
 * Process kuva fields
 * @param  {Object} deps    dependencies for processing
 * @param  {Object[]} packets  packets to emit
 * @returns {Object|Object[]}  object(s) to emit from kuva stuff
 */
module.exports = (deps, packets) => {
  if (!deps.data) {
    logger.error('no kuva data');
    return undefined;
  }
  const data = groupBy(deps.data, 'type');
  Object.keys(data).forEach((type) => {
    deps = {
      ...deps,
      data: data[type],
      id: `kuva.${data[type][0].type.replace(/\s/g, '').toLowerCase()}`,
      activation: data[type][0].activation,
      expiry: data[type][0].expiry,
    };
    const p = require('./objectLike')(deps.data, deps);
    if (p) {
      packets.push(p);
    }
  });
  return packets.filter((p) => p);
};
