import type EventEmitter from 'node:events';
import Twitter, { type BearerTokenOptions, type MediaEntity, type Status, type TwitterClient } from 'twitter';

import toWatch from '@/resources/tweeters.json';
import { logger } from '@/utilities';
import { TWITTER_TIMEOUT, twiClientInfo } from '@/utilities/env';

interface Watchable {
  acc_name: string;
  plain: string;
}

interface TweetAuthor {
  name: string;
  handle: string;
  url: string;
  avatar: string;
}

interface QuotedTweet {
  text: string;
  author: {
    name: string;
    handle: string;
  };
}

interface ParsedTweet {
  id: string;
  uniqueId: string;
  text: string;
  url: string;
  mediaUrl?: string;
  isReply: boolean;
  author: TweetAuthor;
  quote?: QuotedTweet;
  retweet?: QuotedTweet;
  createdAt: Date;
}

type TweetType = 'reply' | 'quote' | 'retweet' | 'tweet';

const determineTweetType = (tweet: Status): TweetType => {
  if (tweet.in_reply_to_status_id) {
    return 'reply';
  }
  if (tweet.quoted_status_id) {
    return 'quote';
  }
  if (tweet.retweeted_status) {
    return 'retweet';
  }
  return 'tweet';
};

const parseAuthor = (tweet: Status): TweetAuthor => ({
  name: tweet.user.name,
  handle: tweet.user.screen_name,
  url: `https://twitter.com/${tweet.user.screen_name}`,
  avatar: `${tweet.user.profile_image_url.replace('_normal.jpg', '.jpg')}`,
});

const parseQuoted = (tweet: Status, type: 'quoted_status' | 'retweeted_status'): QuotedTweet | undefined =>
  tweet[type]
    ? {
        text: (tweet[type] as Status).full_text || (tweet[type] as Status).text,
        author: {
          name: (tweet[type] as Status).user.name,
          handle: (tweet[type] as Status).user.screen_name,
        },
      }
    : undefined;

const parseTweet = (tweets: Status[], watchable: Watchable): ParsedTweet => {
  if (!tweets.length) {
    throw new Error(`No tweets found for ${watchable.acc_name}`);
  }
  const [tweet] = tweets;
  const type = determineTweetType(tweet);
  return {
    id: `twitter.${watchable.plain}.${type}`,
    uniqueId: String(tweets[0].id_str),
    text: tweet.full_text || tweet.text,
    url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
    mediaUrl: tweet.entities.media ? (tweet.entities.media[0] as MediaEntity).media_url : undefined,
    isReply: typeof tweet.in_reply_to_status_id !== 'undefined',
    author: parseAuthor(tweet),
    quote: parseQuoted(tweet, 'quoted_status'),
    retweet: parseQuoted(tweet, 'retweeted_status'),
    createdAt: new Date(tweet.created_at),
  };
};

/**
 * Twitter event handler
 */
export default class TwitterCache {
  private emitter: EventEmitter;
  private timeout: number;
  public clientInfoValid: boolean;
  private client?: TwitterClient;
  private toWatch?: Watchable[];
  private currentData?: ParsedTweet[];
  private lastUpdated: number;
  private updateInterval?: NodeJS.Timeout;
  private updating?: Promise<ParsedTweet[] | undefined>;
  private disposed: boolean;

  /**
   * Create a new Twitter self-updating cache
   * @param eventEmitter - Emitter to push new tweets to
   * @param options - Optional configuration
   * @param options.autoStart - Whether to automatically start polling (default: true)
   * @param options.clientInfo - Custom Twitter client credentials
   * @param options.watchList - Custom list of Twitter accounts to watch
   * @param options.timeout - Polling interval in milliseconds
   */
  constructor(
    eventEmitter: EventEmitter,
    options: {
      autoStart?: boolean;
      clientInfo?: Partial<BearerTokenOptions>;
      watchList?: Watchable[];
      timeout?: number;
    } = {},
  ) {
    this.emitter = eventEmitter;
    this.timeout = options.timeout ?? TWITTER_TIMEOUT;
    this.lastUpdated = Date.now() - 60000;
    this.disposed = false;

    const clientInfo = options.clientInfo ?? twiClientInfo;
    this.clientInfoValid = !!clientInfo.consumer_key && !!clientInfo.consumer_secret && !!clientInfo.bearer_token;

    if (options.watchList) {
      this.toWatch = options.watchList;
    }

    if (options.autoStart !== false) {
      this.initClient(clientInfo);
    }
  }

  private initClient(clientInfo: Partial<BearerTokenOptions>): void {
    try {
      if (this.clientInfoValid && clientInfo.consumer_key && clientInfo.consumer_secret && clientInfo.bearer_token) {
        this.client = new Twitter({
          consumer_key: clientInfo.consumer_key,
          consumer_secret: clientInfo.consumer_secret,
          bearer_token: clientInfo.bearer_token,
        });

        // don't attempt anything else if authentication fails
        if (!this.toWatch) {
          this.toWatch = toWatch as Watchable[];
        }
        this.currentData = undefined;
        this.lastUpdated = Date.now() - 60000;
        this.updateInterval = setInterval(() => this.update(), this.timeout);
        this.update();
      } else {
        logger.warn(`Twitter client not initialized... invalid token: ${clientInfo.bearer_token}`);
        this.dispose();
      }
    } catch (err) {
      logger.error(err);
      this.dispose();
    }
  }

  /**
   * Set a mock Twitter client for testing
   * @param mockClient - Mock Twitter client
   * @internal
   */
  setClient(mockClient: TwitterClient): void {
    this.client = mockClient;
    if (!this.toWatch) {
      this.toWatch = toWatch as Watchable[];
    }
  }

  /**
   * Force the cache to update
   * @returns The currently updating promise
   */
  async update(): Promise<ParsedTweet[] | undefined> {
    // Don't proceed if disposed or client is invalid
    if (this.disposed || !this.clientInfoValid) return undefined;

    if (!this.toWatch || this.toWatch.length === 0) {
      logger.verbose('Not processing twitter, no data to watch.');
      return undefined;
    }

    if (!this.client) {
      logger.verbose('Not processing twitter, no client to connect.');
      return undefined;
    }

    this.updating = this.getParseableData();

    return this.updating;
  }

  /**
   * Get data able to be parsed from twitter.
   * @returns Tweets
   */
  private async getParseableData(): Promise<ParsedTweet[] | undefined> {
    logger.silly('Starting Twitter update...');
    const parsedData: ParsedTweet[] = [];
    try {
      await Promise.all(
        (this.toWatch || []).map(async (watchable) => {
          const tweets = await this.client!.get('statuses/user_timeline', {
            screen_name: watchable.acc_name,
            tweet_mode: 'extended',
            count: 1,
          });
          const tweet = parseTweet(tweets as Status[], watchable);
          parsedData.push(tweet);

          if (tweet.createdAt.getTime() > this.lastUpdated) {
            this.emitter.emit('tweet', tweet);
          }
        }),
      );
      // Update cached data and timestamp after successful fetch
      this.currentData = parsedData;
      this.lastUpdated = Date.now();
    } catch (error) {
      this.onError(error);
    }
    return parsedData;
  }

  /**
   * Handle errors that arise while fetching data from twitter
   * @param error - Twitter error
   */
  private onError(error: unknown): void {
    if (Array.isArray(error) && error[0] && error[0].code === 32) {
      logger.info('wiping twitter client data, could not authenticate...');
      this.dispose();
    } else {
      logger.debug(JSON.stringify(error));
    }
  }

  /**
   * Get the current data or a promise with the current data
   * @returns Either the current data if it's not updating, or the promise returning the new data
   */
  async getData(): Promise<ParsedTweet[] | undefined> {
    if (!this.clientInfoValid) return undefined;

    if (this.updating) {
      return this.updating;
    }
    return this.currentData || [];
  }

  /**
   * Stop polling and clean up resources
   */
  dispose(): void {
    this.disposed = true;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    this.client = undefined;
    this.clientInfoValid = false;
    logger.verbose('Twitter polling stopped and resources cleaned up');
  }
}
