// Mock types matching Twitter API responses
interface TwitterUser {
  id: number;
  id_str: string;
  name: string;
  screen_name: string;
  location?: string;
  description?: string;
  profile_image_url: string;
  profile_image_url_https: string;
}

interface MediaEntity {
  id: number;
  id_str: string;
  media_url: string;
  media_url_https: string;
  url: string;
  display_url: string;
  expanded_url: string;
  type: string;
  sizes: {
    thumb: { w: number; h: number; resize: string };
    small: { w: number; h: number; resize: string };
    medium: { w: number; h: number; resize: string };
    large: { w: number; h: number; resize: string };
  };
}

interface TweetEntities {
  hashtags: unknown[];
  symbols: unknown[];
  user_mentions: unknown[];
  urls: unknown[];
  media?: MediaEntity[];
}

interface MockStatus {
  created_at: string;
  id: number;
  id_str: string;
  text: string;
  full_text: string;
  truncated: boolean;
  entities: TweetEntities;
  source?: string;
  user: TwitterUser;
  is_quote_status: boolean;
  retweet_count: number;
  favorite_count: number;
  favorited: boolean;
  retweeted: boolean;
  lang: string;
  in_reply_to_status_id?: number;
  in_reply_to_status_id_str?: string;
  in_reply_to_user_id?: number;
  in_reply_to_user_id_str?: string;
  in_reply_to_screen_name?: string;
  quoted_status_id?: number;
  quoted_status_id_str?: string;
  quoted_status?: MockStatus;
  retweeted_status?: MockStatus;
}

export const mockTwitterUser: TwitterUser = {
  id: 123456789,
  id_str: '123456789',
  name: 'Warframe',
  screen_name: 'PlayWarframe',
  location: 'London, Ontario',
  description: 'Official Warframe account',
  profile_image_url: 'https://pbs.twimg.com/profile_images/123/test_normal.jpg',
  profile_image_url_https: 'https://pbs.twimg.com/profile_images/123/test_normal.jpg',
};

export const mockTweet: MockStatus = {
  created_at: new Date().toISOString(),
  id: 987654321,
  id_str: '987654321',
  text: 'This is a test tweet',
  full_text: 'This is a test tweet with full text',
  truncated: false,
  entities: {
    hashtags: [],
    symbols: [],
    user_mentions: [],
    urls: [],
  },
  source: '<a href="https://about.twitter.com/products/tweetdeck" rel="nofollow">TweetDeck</a>',
  user: mockTwitterUser,
  is_quote_status: false,
  retweet_count: 10,
  favorite_count: 25,
  favorited: false,
  retweeted: false,
  lang: 'en',
};

export const mockTweetWithMedia: MockStatus = {
  ...mockTweet,
  id_str: '987654322',
  full_text: 'Tweet with an image',
  entities: {
    ...mockTweet.entities,
    media: [
      {
        id: 111222333,
        id_str: '111222333',
        media_url: 'https://pbs.twimg.com/media/test_image.jpg',
        media_url_https: 'https://pbs.twimg.com/media/test_image.jpg',
        url: 'https://t.co/test',
        display_url: 'pic.twitter.com/test',
        expanded_url: 'https://twitter.com/PlayWarframe/status/987654322/photo/1',
        type: 'photo',
        sizes: {
          thumb: { w: 150, h: 150, resize: 'crop' },
          small: { w: 680, h: 383, resize: 'fit' },
          medium: { w: 1200, h: 675, resize: 'fit' },
          large: { w: 1920, h: 1080, resize: 'fit' },
        },
      },
    ],
  },
};

export const mockReplyTweet: MockStatus = {
  ...mockTweet,
  id_str: '987654323',
  full_text: '@user This is a reply',
  in_reply_to_status_id: 111111111,
  in_reply_to_status_id_str: '111111111',
  in_reply_to_user_id: 222222222,
  in_reply_to_user_id_str: '222222222',
  in_reply_to_screen_name: 'user',
};

export const mockQuoteTweet: MockStatus = {
  ...mockTweet,
  id_str: '987654324',
  full_text: 'Quoting another tweet',
  is_quote_status: true,
  quoted_status_id: 333333333,
  quoted_status_id_str: '333333333',
  quoted_status: {
    created_at: new Date(Date.now() - 3600000).toISOString(),
    id: 333333333,
    id_str: '333333333',
    text: 'Original quoted tweet',
    full_text: 'Original quoted tweet full text',
    truncated: false,
    entities: {
      hashtags: [],
      symbols: [],
      user_mentions: [],
      urls: [],
    },
    user: {
      ...mockTwitterUser,
      id_str: '444444444',
      name: 'Other User',
      screen_name: 'OtherUser',
    },
    is_quote_status: false,
    retweet_count: 5,
    favorite_count: 15,
    favorited: false,
    retweeted: false,
    lang: 'en',
  },
};

export const mockRetweet: MockStatus = {
  ...mockTweet,
  id_str: '987654325',
  full_text: 'RT @OriginalUser: Original tweet text',
  retweeted_status: {
    created_at: new Date(Date.now() - 7200000).toISOString(),
    id: 555555555,
    id_str: '555555555',
    text: 'Original tweet text',
    full_text: 'Original tweet text full',
    truncated: false,
    entities: {
      hashtags: [],
      symbols: [],
      user_mentions: [],
      urls: [],
    },
    user: {
      ...mockTwitterUser,
      id_str: '666666666',
      name: 'Original User',
      screen_name: 'OriginalUser',
    },
    is_quote_status: false,
    retweet_count: 50,
    favorite_count: 100,
    favorited: false,
    retweeted: false,
    lang: 'en',
  },
};

export const mockWatchable = {
  acc_name: 'PlayWarframe',
  plain: 'playwarframe',
};

export const mockTwitterClientInfo = {
  consumer_key: 'test_consumer_key',
  consumer_secret: 'test_consumer_secret',
  bearer_token: 'test_bearer_token',
};
