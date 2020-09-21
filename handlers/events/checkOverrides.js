'use strict';

const eKeyOverrides = require('./eKeyOverrides');

/**
 * Find overrides for the provided key
 * @param  {string} key  worldsate field to find overrides
 * @param  {Object} data data corresponding to the key from provided worldstate
 * @returns {string}      overrided key
 */
module.exports = (key, data) => {
  if (typeof eKeyOverrides[key] === 'string') {
    return eKeyOverrides[key];
  }
  if (typeof eKeyOverrides[key] === 'function') {
    return eKeyOverrides[key](data);
  }
  return key;
};
