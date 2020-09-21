'use strict';

const checkOverrides = require('./checkOverrides');

/**
 * arrayLike are all just arrays of objectLike
 * @param  {Object} deps    dependencies for processing
 * @param  {Object[]} packets  packets to emit
 * @returns {Object|Object[]}  object(s) to emit from arrayLike processing
 */
module.exports = (deps, packets) => {
  deps.data.forEach((arrayItem) => {
    const k = checkOverrides(deps.key, arrayItem);
    packets.push(require('./objectLike')(arrayItem, {
      ...deps,
      id: k,
    }));
  });
  return packets;
};
