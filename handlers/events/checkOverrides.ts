import { overrides } from '@/handlers/events/eKeyOverrides';
import type { BaseEventData, OverrideResult } from '@/handlers/events/types';

/**
 * Find overrides for the provided key
 * @param key - worldstate field to find overrides
 * @param data - data corresponding to the key from provided worldstate
 * @returns overrided key or object
 */
export default (key: string, data: BaseEventData): OverrideResult => {
  const override = overrides[key];

  if (typeof override === 'string') {
    return override;
  }
  if (typeof override === 'function') {
    return override(data);
  }
  return key;
};
