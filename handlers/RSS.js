import RssFeedEmitter from 'rss-feed-emitter';
import feeds from '../resources/rssFeeds.json' assert { type: 'json' };

import { logger } from '../utilities/index.js';

/**
 * RSS Emitter, leverages [rss-feed-emitter](https://npmjs.org/package/rss-feed-emitter)
 */
export default class RSS {
  /**
   * Set up emitting events for warframe forum entries
   * @param {EventEmitter} eventEmitter Emitter to send events from
   */
  constructor(eventEmitter) {
    this.logger = logger;
    this.emitter = eventEmitter;
    this.feeder = new RssFeedEmitter({
      userAgent: 'WFCD Feed Notifier',
      skipFirstLoad: true,
    });

    feeds.forEach((feed) => {
      this.feeder.add({ url: feed.url, timeout: 30000 });
    });
    this.logger.debug('RSS Feed active');

    this.start = Date.now();
    this.feeder.on('error', this.logger.error.bind(this.logger));
    this.feeder.on('new-item', this.handleNew.bind(this));
  }

  handleNew(item) {
    try {
      if (Object.keys(item.image).length) {
        this.logger.debug(`Image: ${JSON.stringify(item.image)}`);
      }
      if (new Date(item.pubDate).getTime() <= this.start) return;

      const feed = feeds.filter((feedEntry) => feedEntry.url === item.meta.link)[0];
      let firstImg = ((item.description || '').match(/<img.*src="(.*)".*>/i) || [])[1];
      if (!firstImg) {
        firstImg = feed.defaultAttach;
      } else if (firstImg.startsWith('//')) {
        firstImg = firstImg.replace('//', 'https://');
      }

      const rssSummary = {
        body: (item.description || '\u200B').replace(/<(?:.|\n)*?>/gm, '').replace(/\n\n+\s*/gm, '\n\n'),
        url: item.link,
        timestamp: item.pubDate,
        description: item.meta.description,
        author: feed.author || {
          name: 'Warframe Forums',
          url: item['rss:link']['#'],
          icon_url: 'https://i.imgur.com/hE2jdpv.png',
        },
        title: item.title,
        image: firstImg,
        id: feed.key,
      };
      this.emitter.emit('rss', rssSummary);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
