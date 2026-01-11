import type EventEmitter from 'node:events';
import type { RSSItem } from 'rss-feed-emitter';
import RssFeedEmitter from 'rss-feed-emitter';
import sanitizeHtml from 'sanitize-html';

import feeds from '@/resources/rssFeeds.json';
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
  private start: number;

  /**
   * Set up emitting events for warframe forum entries
   * @param eventEmitter - Emitter to send events from
   */
  constructor(eventEmitter: EventEmitter) {
    this.emitter = eventEmitter;
    this.feeder = new RssFeedEmitter({
      userAgent: 'WFCD Feed Notifier',
      skipFirstLoad: true,
    });

    for (const feed of feeds as Feed[]) {
      this.feeder.add({ url: feed.url, refresh: 30000 });
    }
    this.logger.debug('RSS Feed active');

    this.start = Date.now();
    this.feeder.on('error', this.logger.error.bind(this.logger));
    this.feeder.on('new-item', this.handleNew.bind(this));
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
      if (new Date(item.pubDate).getTime() <= this.start) return;

      const feed = (feeds as Feed[]).find((feedEntry) => feedEntry.url === item.meta.link);
      if (!feed) return;

      let firstImg: string | undefined = ((item.description || '').match(/<img.*src="(.*)".*>/i) || [])[1];
      if (!firstImg) {
        firstImg = feed.defaultAttach;
      } else if (firstImg.startsWith('//')) {
        firstImg = firstImg.replace('//', 'https://');
      }

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
