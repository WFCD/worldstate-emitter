export interface RSSImage {
  url?: string;
  title?: string;
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
  categories?: string[];
  meta: RSSMeta;
}

/** v4 `Feed` declarations omit `url`. Runtime objects still have it. */
export interface RSSFeedList {
  url: string;
  items: RSSItem[];
}
