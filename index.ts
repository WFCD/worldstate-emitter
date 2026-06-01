import EventEmitter from 'node:events';

import type { RSSItem } from 'rss-feed-emitter';
import type WorldState from 'warframe-worldstate-parser';
import type { Logger } from 'winston';
import RSS from '@/handlers/RSS';
import Twitter from '@/handlers/Twitter';
import Worldstate from '@/handlers/Worldstate';
import { FEATURES } from '@/resources/config';
import { logger, setLogger } from '@/utilities';

interface WorldstateEmitterOptions {
  locale?: string;
  features?: string[];
  logger?: Logger;
}

interface RssFeedItem {
  url: string;
  items: RSSItem[];
}

interface RssEventBody {
  id: string;
}

interface WorldstateRawEventBody {
  platform: string;
}

interface WorldstateParsedEventBody {
  platform: string;
  language: string;
}

interface WorldstateEventBody {
  id: string;
  platform: string;
  language: string;
}

interface TweetEventBody {
  id: string;
}

interface DebugInfo {
  rss?: RssFeedItem[];
  worldstate?: WorldState;
  twitter?: unknown;
}

export default class WorldstateEmitter extends EventEmitter {
  #locale?: string;
  #worldstate?: Worldstate;
  #twitter?: Twitter;
  #rss?: RSS;
  #logger?: Logger;

  static async make({ locale, features, logger: upLogger }: WorldstateEmitterOptions = {}): Promise<WorldstateEmitter> {
    if (upLogger) {
      setLogger(upLogger);
    }
    const emitter = new WorldstateEmitter({ locale, logger: upLogger });
    await emitter.#init(features?.length ? features : FEATURES);
    return emitter;
  }

  /**
   * Pull in and instantiate emitters
   * @param options - Configuration options
   */
  constructor({ locale, logger: uLogger }: WorldstateEmitterOptions = {}) {
    super();
    this.#locale = locale;
    this.#logger = uLogger || logger;
  }

  async #init(features: string[]): Promise<void> {
    if (features.includes('rss')) {
      this.#rss = new RSS(this, { logger: this.#logger });
    }
    if (features.includes('worldstate')) {
      this.#worldstate = new Worldstate(this, { locale: this.#locale, logger: this.#logger });
      await this.#worldstate.init();
    }
    if (features.includes('twitter')) {
      this.#twitter = new Twitter(this, { logger: this.#logger });
    }

    this.#logger!.silly('hey look, i started up...');
    this.setupLogging();
  }

  /**
   * Set up internal logging
   * @private
   */
  private setupLogging(): void {
    const log = this.#logger!;
    this.on('error', log.error.bind(log));

    this.on('rss', (body: RssEventBody) => log.silly(`emitted: ${body.id}`));
    this.on('ws:update:raw', (body: WorldstateRawEventBody) => log.silly(`emitted raw: ${body.platform}`));
    this.on('ws:update:parsed', (body: WorldstateParsedEventBody) =>
      log.silly(`emitted parsed: ${body.platform} in ${body.language}`),
    );
    this.on('ws:update:event', (body: WorldstateEventBody) =>
      log.silly(`emitted event: ${body.id} ${body.platform} in ${body.language}`),
    );
    this.on('tweet', (body: TweetEventBody) => log.silly(`emitted: ${body.id}`));
  }

  /**
   * Get current rss feed items
   * @returns RSS feed items
   */
  getRss(): RssFeedItem[] | undefined {
    if (!this.#rss) return undefined;
    return this.#rss.feeder.list.map((i) => ({ url: i.url, items: i.items }));
  }

  /**
   * Get a specific worldstate, defaulting to 'pc' for the platform and 'en' for the language
   * @param language - locale/language to fetch
   * @returns Requested worldstate
   */
  getWorldstate(language = 'en'): WorldState | undefined {
    if (!this.#worldstate) return undefined;
    return this.#worldstate?.get(language);
  }

  get debug(): DebugInfo {
    return {
      rss: FEATURES.includes('rss') ? this.getRss() : undefined,
      worldstate: FEATURES.includes('worldstate') ? this.#worldstate?.get() : undefined,
      twitter: this.#twitter?.clientInfoValid ? this.#twitter.getData() : undefined,
    };
  }

  /**
   * Get Twitter data
   * @returns Promised twitter data
   */
  async getTwitter(): Promise<unknown> {
    return this.#twitter?.clientInfoValid ? this.#twitter.getData() : undefined;
  }

  destroy(): void {
    if (this.#rss) {
      this.#rss.destroy();
      this.#rss = undefined;
    }
    if (this.#worldstate) {
      this.#worldstate.destroy();
      this.#worldstate = undefined;
    }
    if (this.#twitter) {
      this.#twitter.dispose();
      this.#twitter = undefined;
    }
    this.#logger!.debug('Emitter destroyed');
  }
}
