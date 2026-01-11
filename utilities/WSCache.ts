import type EventEmitter from 'node:events';

import type WorldState from 'warframe-worldstate-parser';

import type CronCache from '@/utilities/Cache';
import { logger } from '@/utilities/index';

interface WSCacheOptions {
  language: string;
  kuvaCache: CronCache;
  sentientCache: CronCache;
  eventEmitter: EventEmitter;
}

interface WorldStateDeps {
  locale: string;
  kuvaData: Record<string, unknown>;
  sentientData: Record<string, unknown>;
}

/**
 * Warframe WorldState Cache - store and retrieve current worldstate data
 */
export default class WSCache {
  #inner: WorldState | undefined;
  #kuvaCache: CronCache;
  #sentientCache: CronCache;
  #logger = logger;
  #emitter: EventEmitter;
  #platform = 'pc';
  #language: string;

  /**
   * Set up a cache checking for data and updates to a specific worldstate set
   * @param options - Configuration options
   * @param options.language - Language/translation to track
   * @param options.kuvaCache - Cache of kuva data, provided by Semlar
   * @param options.sentientCache - Cache of sentient outpost data, provided by Semlar
   * @param options.eventEmitter - Emitter to push new worldstate updates to
   */
  constructor({ language, kuvaCache, sentientCache, eventEmitter }: WSCacheOptions) {
    this.#inner = undefined;
    this.#kuvaCache = kuvaCache;
    this.#sentientCache = sentientCache;
    this.#language = language;
    this.#emitter = eventEmitter;
  }

  /**
   * Update the current data with new data
   * @param newData - updated worldstate data
   * @private
   */
  #update = async (newData: string): Promise<void> => {
    const deps: WorldStateDeps = {
      locale: this.#language,
      kuvaData: {},
      sentientData: {},
    };
    try {
      const kuvaRaw = await this.#kuvaCache.get();
      if (kuvaRaw) {
        deps.kuvaData = JSON.parse(kuvaRaw);
      }
    } catch (err) {
      logger.debug(`Error parsing kuva data for ${this.#language}: ${err}`);
    }
    try {
      const sentientRaw = await this.#sentientCache.get();
      if (sentientRaw) {
        deps.sentientData = JSON.parse(sentientRaw);
      }
    } catch (err) {
      logger.warn(`Error parsing sentient data for ${this.#language}: ${err}`);
    }

    let t: WorldState | undefined;
    try {
      // @ts-expect-error - WorldState.build exists but might not be in types
      t = await WorldState.build(newData, deps);
      if (!t?.timestamp) return;
    } catch (err) {
      this.#logger.warn(`Error parsing worldstate data for ${this.#language}: ${err}`);
      return;
    }

    this.#inner = t;
    this.#emitter.emit('ws:update:parsed', {
      language: this.#language,
      platform: this.#platform,
      data: t,
    });
  };

  /**
   * Get the latest worldstate data from this cache
   * @returns Current worldstate data
   */
  get data(): WorldState | undefined {
    return this.#inner;
  }

  /**
   * Set the current data, also parses and emits data
   * @param newData - New string data to parse
   */
  set data(newData: string) {
    logger.debug(`got new data for ${this.#language}, parsing...`);
    void this.#update(newData);
  }

  /**
   * Set the current twitter data for the worldstate
   * @param newTwitter - twitter data
   */
  set twitter(newTwitter: unknown[]) {
    if (!newTwitter?.length) return;
    if (this.#inner) {
      // @ts-expect-error - twitter property might not be in types
      this.#inner.twitter = newTwitter;
    }
  }
}
