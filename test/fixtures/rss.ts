/**
 * Mock RSS feed data for testing
 */

interface RSSItem {
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
  image?: {
    url?: string;
    title?: string;
  };
  categories?: string[];
  enclosures?: unknown[];
  meta: {
    title: string;
    description?: string;
    link: string;
    'rss:link'?: {
      '#'?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

export const mockRSSItem: RSSItem = {
  title: 'Test RSS Item',
  description: 'This is a test RSS item with <img src="https://example.com/image.png" /> an image',
  summary: 'Test summary',
  date: new Date(Date.now() + 1000), // Future date
  pubdate: new Date(Date.now() + 1000),
  pubDate: new Date(Date.now() + 1000),
  link: 'https://example.com/post/123',
  guid: 'https://example.com/post/123',
  author: 'Test Author',
  comments: 'https://example.com/post/123#comments',
  origlink: 'https://example.com/post/123',
  image: {
    url: 'https://example.com/image.png',
    title: 'Test Image',
  },
  categories: ['news', 'updates'],
  enclosures: [],
  meta: {
    title: 'Test Feed',
    description: 'Test feed description',
    link: 'https://forums.warframe.com/forum/3-pc-update-notes.xml', // Use actual feed URL
    'rss:link': {
      '#': 'https://forums.warframe.com/forum/3-pc-update-notes.xml',
    },
  },
};

export const mockRSSItemWithoutImage: RSSItem = {
  ...mockRSSItem,
  description: 'This is a test RSS item without an image',
  image: undefined,
};

export const mockRSSItemWithRelativeImage: RSSItem = {
  ...mockRSSItem,
  description: 'This is a test with <img src="//example.com/relative.png" /> relative image',
};

export const mockTwitterData = [
  {
    id: 123456789,
    id_str: '123456789',
    text: 'Test tweet',
    created_at: 'Sat Jan 11 12:00:00 +0000 2026',
    user: {
      id: 987654321,
      id_str: '987654321',
      name: 'Test User',
      screen_name: 'testuser',
      profile_image_url_https: 'https://example.com/avatar.png',
    },
    entities: {
      hashtags: [],
      symbols: [],
      user_mentions: [],
      urls: [],
      media: [],
    },
  },
];
