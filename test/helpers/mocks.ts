/**
 * Mock utilities for testing
 */
import { EventEmitter } from 'node:events';
import type Cache from '../../utilities/Cache';

/**
 * Create a mock EventEmitter for testing
 */
export function createMockEmitter(): EventEmitter {
  return new EventEmitter();
}

/**
 * Create a mock Cache instance
 */
export function createMockCache(initialData?: string): Partial<Cache> {
  const emitter = new EventEmitter();
  let data = initialData || '';

  return {
    get: async () => data,
    on: (event: string, callback: (...args: unknown[]) => void) => {
      emitter.on(event, callback);
    },
    emit: (event: string, ...args: unknown[]) => {
      emitter.emit(event, ...args);
    },
    trigger: (newData: string) => {
      data = newData;
      emitter.emit('update', newData);
    },
  } as Partial<Cache> & { trigger: (data: string) => void };
}

/**
 * Create a spy for tracking function calls
 */
export function createSpy<T extends (...args: unknown[]) => unknown>(): T & {
  calls: unknown[][];
  callCount: number;
  reset: () => void;
} {
  const calls: unknown[][] = [];

  const spy = ((...args: unknown[]) => {
    calls.push(args);
    return undefined;
  }) as T & {
    calls: unknown[][];
    callCount: number;
    reset: () => void;
  };

  Object.defineProperty(spy, 'callCount', {
    get: () => calls.length,
  });

  spy.calls = calls;
  spy.reset = () => {
    calls.length = 0;
  };

  return spy;
}

/**
 * Wait for an event to be emitted
 */
export function waitForEvent<T = unknown>(emitter: EventEmitter, event: string, timeout = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Event "${event}" not emitted within ${timeout}ms`));
    }, timeout);

    emitter.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/**
 * Create a mock RSS Feed Emitter
 */
export function createMockRssFeedEmitter() {
  const emitter = new EventEmitter();
  const feeds: Array<{ url: string; items: unknown[] }> = [];

  return {
    add: ({ url }: { url: string; refresh?: number }) => {
      feeds.push({ url, items: [] });
    },
    remove: (url: string) => {
      const index = feeds.findIndex((f) => f.url === url);
      if (index !== -1) feeds.splice(index, 1);
    },
    destroy: () => {
      feeds.length = 0;
    },
    list: feeds,
    on: (event: string, callback: (...args: unknown[]) => void) => {
      emitter.on(event, callback);
    },
    emit: (event: string, ...args: unknown[]) => {
      emitter.emit(event, ...args);
    },
    trigger: (event: string, item: unknown) => {
      emitter.emit(event, item);
    },
  };
}
