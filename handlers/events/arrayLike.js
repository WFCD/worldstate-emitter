import { logger } from '../../utilities/index.js';

import checkOverrides from './checkOverrides.js';
import objectLike from './objectLike.js';

/**
 * arrayLike are all just arrays of objectLike
 * @param  {Object} deps    dependencies for processing
 * @param  {Object[]} packets  packets to emit
 * @returns {Object|Object[]}  object(s) to emit from arrayLike processing
 */
export default (deps, packets) => {
  try {
    deps.data.forEach((arrayItem) => {
      const k = checkOverrides(deps.key, arrayItem);
      packets.push(
        objectLike(arrayItem, {
          ...deps,
          id: k,
        })
      );
    });
    return packets;
  } catch (err) {
    logger.error(err);
  }
};
