declare module 'rss-feed-emitter' {
  import type { EventEmitter } from 'node:events';

  export interface RSSImage {
    url?: string;
    title?: string;
    [key: string]: unknown;
  }

  export interface RSSSource {
    url?: string;
    title?: string;
    [key: string]: unknown;
  }

  export interface RSSEnclosure {
    url: string;
    type?: string;
    length?: string;
    [key: string]: unknown;
  }

  export interface RSSMeta {
    title: string;
    description?: string;
    link: string;
    'rss:link'?: {
      '#'?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  export interface RSSItem {
    title: string;
    description?: string;
    summary?: string;
    date: Date;
    pubdate: Date;
    pubDate: Date;
    link: string;
    guid: string;
    author?: string;
    comments?: string;
    origlink?: string;
    image?: RSSImage;
    source?: RSSSource;
    categories?: string[];
    enclosures?: RSSEnclosure[];
    meta: RSSMeta;
  }

  export interface RSSFeedItem {
    url: string;
    refresh?: number;
  }

  export interface RSSFeedList {
    url: string;
    items: RSSItem[];
  }

  export default class RssFeedEmitter extends EventEmitter {
    constructor(options?: { userAgent?: string; skipFirstLoad?: boolean });
    add(feed: RSSFeedItem): void;
    remove(url: string): void;
    destroy(): void;
    list: RSSFeedList[];
  }
}
