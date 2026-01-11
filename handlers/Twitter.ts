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

  /**
   * Create a new Twitter self-updating cache
   * @param eventEmitter - Emitter to push new tweets to
   */
  constructor(eventEmitter: EventEmitter) {
    this.emitter = eventEmitter;
    this.timeout = TWITTER_TIMEOUT;
    this.clientInfoValid =
      !!twiClientInfo.consumer_key && !!twiClientInfo.consumer_secret && !!twiClientInfo.bearer_token;
    this.lastUpdated = Date.now() - 60000;
    this.initClient(twiClientInfo);
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
        this.toWatch = toWatch as Watchable[];
        this.currentData = undefined;
        this.lastUpdated = Date.now() - 60000;
        this.updateInterval = setInterval(() => this.update(), this.timeout);
        this.update();
      } else {
        logger.warn(`Twitter client not initialized... invalid token: ${clientInfo.bearer_token}`);
      }
    } catch (err) {
      this.client = undefined;
      this.clientInfoValid = false;
      logger.error(err);
    }
  }

  /**
   * Force the cache to update
   * @returns The currently updating promise
   */
  async update(): Promise<ParsedTweet[] | undefined> {
    if (!this.clientInfoValid) return undefined;

    if (!this.toWatch) {
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
    } catch (error) {
      this.onError(error);
    }
    this.lastUpdated = Date.now();
    return parsedData;
  }

  /**
   * Handle errors that arise while fetching data from twitter
   * @param error - Twitter error
   */
  private onError(error: unknown): void {
    if (Array.isArray(error) && error[0] && error[0].code === 32) {
      this.clientInfoValid = false;
      logger.info('wiping twitter client data, could not authenticate...');
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
    return this.currentData;
  }
}
