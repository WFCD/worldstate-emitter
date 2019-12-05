'use strict';

const RssFeedEmitter = require('rss-feed-emitter');
const feeds = require('../resources/rssFeeds.json');

const { logger } = require('../utilities');

class RSS {
  constructor(eventEmitter) {
    this.logger = logger;
    this.emitter = eventEmitter;
    this.feeder = new RssFeedEmitter({ userAgent: 'WFCD Feed Notifier' });

    feeds.forEach((feed) => {
      this.feeder.add({ url: feed.url, timeout: 30000 });
    });

    this.logger.debug('RSS Feed active');

    this.start = Date.now();

    this.feeder.on('error', this.logger.error);

    this.feeder.on('new-item', (item) => {
      try {
        if (Object.keys(item.image).length) {
          this.logger.debug(`Image: ${JSON.stringify(item.image)}`);
        }

        if (new Date(item.pubDate).getTime() > this.start) {
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
        }
      } catch (error) {
        this.logger.error(error);
      }
    });
  }
}

module.exports = RSS;
