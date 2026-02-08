import type EventEmitter from 'node:events';

import wsData from 'warframe-worldstate-data';
import type WorldState from 'warframe-worldstate-parser';
import parseNew from '@/handlers/events/parse';
import type { BaseEventData, EventPacket } from '@/handlers/events/types';
import { externalCron, kuvaUrl, sentientUrl, worldstateCron, worldstateUrl } from '@/resources/config';
import { lastUpdated, logger } from '@/utilities';
import Cache from '@/utilities/Cache';
import WSCache from '@/utilities/WSCache';

const { locales } = wsData;
const debugEvents = ['arbitration', 'kuva', 'nightwave'];

interface ParseEventsPacket {
  worldstate: WorldState;
  platform: string;
  language?: string;
}

/**
 * Handler for worldstate data
 */
export default class Worldstate {
  #emitter: EventEmitter;
  #locale?: string;
  #worldStates: Record<string, WSCache> = {};
  #wsRawCache?: Cache;
  #kuvaCache?: Cache;
  #sentientCache?: Cache;

  /**
   * Set up listening for specific platform and locale if provided.
   * @param eventEmitter - Emitter to push new worldstate events to
   * @param locale - Locale (actually just language) to watch
   */
  constructor(eventEmitter: EventEmitter, locale?: string) {
    this.#emitter = eventEmitter;
    this.#locale = locale;
    logger.debug('starting up worldstate listener...');
    if (locale) {
      logger.debug(`only listening for ${locale}...`);
    }
  }

  async init(): Promise<void> {
    this.#wsRawCache = await Cache.make(worldstateUrl, worldstateCron);
    this.#kuvaCache = await Cache.make(kuvaUrl, externalCron);
    this.#sentientCache = await Cache.make(sentientUrl, externalCron);

    await this.setUpRawEmitters();
    this.setupParsedEvents();
  }

  /**
   * Set up emitting raw worldstate data
   */
  async setUpRawEmitters(): Promise<void> {
    this.#worldStates = {};

    for await (const locale of locales) {
      if (!this.#locale || this.#locale === locale) {
        this.#worldStates[locale] = new WSCache({
          language: locale,
          kuvaCache: this.#kuvaCache!,
          sentientCache: this.#sentientCache!,
          eventEmitter: this.#emitter,
        });
      }
    }

    /* listen for the raw cache updates so we can emit them from the super emitter */
    this.#wsRawCache!.on('update', (dataStr: string) => {
      this.#emitter.emit('ws:update:raw', { platform: 'pc', data: dataStr });
    });

    /* when the raw emits happen, parse them and store them on parsed worldstate caches */
    this.#emitter.on('ws:update:raw', ({ data }: { data: string }) => {
      logger.debug('ws:update:raw - updating locales data');
      locales.forEach((locale) => {
        if (!this.#locale || this.#locale === locale) {
          this.#worldStates[locale].data = data;
        }
      });
    });
  }

  /**
   * Set up listeners for the parsed worldstate updates
   */
  setupParsedEvents(): void {
    this.#emitter.on(
      'ws:update:parsed',
      ({ language, platform, data }: { language: string; platform: string; data: WorldState }) => {
        const packet = { platform, worldstate: data, language };
        this.parseEvents(packet);
      },
    );
  }

  /**
   * Parse new worldstate events
   * @param packet - Object containing worldstate, platform, and language
   */
  parseEvents({ worldstate, platform, language = 'en' }: ParseEventsPacket): void {
    const cycleStart = Date.now();
    const packets: EventPacket[] = [];
    Object.keys(worldstate).forEach((key) => {
      const wsRecord = worldstate as unknown as Record<string, unknown>;
      if (worldstate && wsRecord[key]) {
        const packet = parseNew({
          data: wsRecord[key] as BaseEventData | BaseEventData[],
          key,
          language,
          platform,
          cycleStart,
        });

        if (Array.isArray(packet)) {
          if (packet.length) {
            packets.push(...(packet.filter((p) => p) as EventPacket[]));
          }
        } else if (packet) {
          packets.push(packet as EventPacket);
        }
      }
    });

    lastUpdated[platform][language] = Date.now();
    packets
      .filter((p): p is EventPacket => !!p && !!p.id)
      .forEach((packet) => {
        this.emit('ws:update:event', packet);
      });
  }

  /**
   * Emit an event with given id
   * @param id - Id of the event to emit
   * @param packet - Data packet to emit
   */
  emit(id: string, packet: EventPacket): void {
    if (debugEvents.includes(packet.key)) logger.warn(packet.key);

    logger.debug(`ws:update:event - emitting ${packet.id}`);
    delete packet.cycleStart;
    this.#emitter.emit(id, packet);
  }

  /**
   * get a specific worldstate version
   * @param language - Locale of the worldstate
   * @returns Worldstate corresponding to provided data
   * @throws When the platform or locale aren't tracked and aren't updated
   */
  get(language = 'en'): WorldState | undefined {
    logger.debug(`getting worldstate ${language}...`);
    if (this.#worldStates?.[language]) {
      return this.#worldStates?.[language]?.data;
    }
    throw new Error(`Language (${language}) not tracked.\nEnsure that the parameters passed are correct`);
  }

  destroy(): void {
    this.#wsRawCache?.stop();
    this.#kuvaCache?.stop();
    this.#sentientCache?.stop();
  }
}
