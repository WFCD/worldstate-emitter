import type EventEmitter from 'node:events';
import type { RSSItem } from 'rss-feed-emitter';
import RssFeedEmitter from 'rss-feed-emitter';
import sanitizeHtml from 'sanitize-html';

import feedsJson from '@/resources/rssFeeds.json';
import { logger } from '@/utilities';

interface FeedAuthor {
  name: string;
  url: string;
  icon_url: string;
}

interface Feed {
  url: string;
  key: string;
  defaultAttach?: string;
  author?: FeedAuthor;
}

interface RssSummary {
  body: string;
  url: string;
  timestamp: Date;
  description?: string;
  author: FeedAuthor;
  title: string;
  image?: string;
  id: string;
}

/**
 * RSS Emitter, leverages rss-feed-emitter
 */
export default class RSS {
  private logger = logger;
  private emitter: EventEmitter;
  public feeder: RssFeedEmitter;
  private startTime: number;
  private feeds: Feed[];

  /**
   * Set up emitting events for warframe forum entries
   * @param eventEmitter - Emitter to send events from
   * @param options - Optional configuration
   * @param options.autoStart - Whether to automatically start the feeder (default: true)
   * @param options.feeds - Custom feed list (default: uses rssFeeds.json)
   * @param options.startTime - Custom start time for filtering old items (default: Date.now())
   * @param options.logger - Custom logger instance (default: uses global logger)
   */
  constructor(
    eventEmitter: EventEmitter,
    options: {
      autoStart?: boolean;
      feeds?: Feed[];
      startTime?: number;
      logger?: typeof logger;
    } = {},
  ) {
    this.emitter = eventEmitter;
    this.feeds = options.feeds || (feedsJson as Feed[]);
    this.startTime = options.startTime ?? Date.now();
    if (options.logger) {
      this.logger = options.logger;
    }

    this.feeder = new RssFeedEmitter({
      userAgent: 'WFCD Feed Notifier',
      skipFirstLoad: true,
    });

    this.feeder.on('error', this.logger.error.bind(this.logger));
    this.feeder.on('new-item', this.handleNew.bind(this));

    if (options.autoStart !== false) {
      this.start();
    }
  }

  /**
   * Start the RSS feed polling
   */
  start(): void {
    for (const feed of this.feeds) {
      this.feeder.add({ url: feed.url, refresh: 30000 });
    }
    this.logger.debug('RSS Feed active');
  }

  destroy(): void {
    this.feeder.destroy();
    this.logger.debug('RSS Feed destroyed');
  }

  /**
   * Extract image URL from RSS item description
   * @param description - The RSS item description HTML
   * @param feed - The feed configuration
   * @returns The image URL or undefined
   * @private
   */
  private extractImage(description: string | undefined, feed: Feed): string | undefined {
    const firstImg: string | undefined = ((description || '').match(/<img.*src="(.*)".*>/i) || [])[1];
    if (!firstImg) {
      return feed.defaultAttach;
    }
    if (firstImg.startsWith('//')) {
      return firstImg.replace('//', 'https://');
    }
    return firstImg;
  }

  /**
   * Find the feed configuration for an RSS item
   * @param item - The RSS item
   * @returns The feed configuration or undefined
   * @private
   */
  private findFeed(item: RSSItem): Feed | undefined {
    // Strategy 1: Try exact match with item.meta.link
    let feed = this.feeds.find((feedEntry) => feedEntry.url === item.meta.link);
    if (feed) return feed;

    // Strategy 2: Try match with item.meta['rss:link']['#']
    const rssLink = item.meta['rss:link']?.['#'];
    if (rssLink) {
      feed = this.feeds.find((feedEntry) => feedEntry.url === rssLink);
      if (feed) return feed;
    }

    // Strategy 3: Use feeder.list to find registered feed by item URL
    const registeredFeeds = this.feeder.list;
    if (Array.isArray(registeredFeeds)) {
      for (const registeredFeed of registeredFeeds) {
        const matchingFeed = this.feeds.find((f) => f.url === registeredFeed.url);
        if (matchingFeed) {
          // Check if this feed would have produced this item
          // This is a best-effort match when other strategies fail
          return matchingFeed;
        }
      }
    }

    this.logger.debug(`No feed found for item: ${item.title} (meta.link: ${item.meta.link})`);
    return undefined;
  }

  /**
   * Handle a new RSS item
   * @param item - The RSS item from the feed
   * @private
   */
  private handleNew(item: RSSItem): void {
    try {
      if (item.image && Object.keys(item.image).length) {
        this.logger.debug(`Image: ${JSON.stringify(item.image)}`);
      }
      if (new Date(item.pubDate).getTime() <= this.startTime) return;

      const feed = this.findFeed(item);
      if (!feed) return;

      const firstImg = this.extractImage(item.description, feed);

      const rssSummary: RssSummary = {
        body: sanitizeHtml(item.description || '\u200B', { allowedTags: [], allowedAttributes: {} }).replace(
          /\n\n+\s*/gm,
          '\n\n',
        ),
        url: item.link,
        timestamp: item.pubDate,
        description: item.meta.description,
        author: feed.author || {
          name: 'Warframe Forums',
          url: (item.meta['rss:link']?.['#'] || item.link) as string,
          icon_url: 'https://i.imgur.com/hE2jdpv.png',
        },
        title: item.title,
        ...(firstImg && { image: firstImg }),
        id: feed.key,
      };
      this.emitter.emit('rss', rssSummary);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
