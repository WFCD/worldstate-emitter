/**
 * Shared type definitions for worldstate event handling
 */

export interface BaseEventData {
  activation: Date | string | number;
  expiry?: Date | string | number;
  id?: string;
  [key: string]: unknown;
}

export interface CycleLike extends BaseEventData {
  state: string;
}

export interface KuvaData extends BaseEventData {
  type: string;
}

export interface BaseDeps {
  key: string;
  platform: string;
  language: string;
  cycleStart?: Date | number;
  id?: string;
}

export interface EventDeps extends BaseDeps {
  data: BaseEventData;
}

export interface ArrayEventDeps extends BaseDeps {
  data: BaseEventData[];
}

export interface CycleDeps extends BaseDeps {
  data: CycleLike;
}

export interface EventPacket extends BaseDeps {
  data: BaseEventData | CycleLike;
  [key: string]: unknown;
}

export type OverrideFunction = (data: BaseEventData) => string | { eventKey: string; activation: Date };
export type OverrideValue = string | OverrideFunction;
export type OverrideResult = string | { eventKey: string; activation: Date };

export interface OverrideMap {
  [key: string]: OverrideValue;
}
