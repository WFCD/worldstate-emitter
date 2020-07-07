'use strict';

const Twitter = require('twitter');
const toWatch = require('../resources/tweeters.json');

const { logger } = require('../utilities');

const determineTweetType = (tweet) => {
  if (tweet.in_reply_to_status_id) {
    return ('reply');
  }
  if (tweet.quoted_status_id) {
    return ('quote');
  }
  if (tweet.retweeted_status) {
    return ('retweet');
  }
  return ('tweet');
};

const parseAuthor = (tweet) => ({
  name: tweet.user.name,
  handle: tweet.user.screen_name,
  url: `https://twitter.com/${tweet.user.screen_name}`,
  avatar: `${tweet.user.profile_image_url.replace('_normal.jpg', '.jpg')}`,
});

const parseQuoted = (tweet, type) => (tweet[type]
  ? {
    text: tweet[type].full_text,
    author: {
      name: tweet[type].user.name,
      handle: tweet[type].user.screen_name,
    },
  }
  : undefined);

const parseTweet = (tweets, watchable) => {
  const [tweet] = tweets;
  const type = determineTweetType(tweet);
  return {
    id: `twitter.${watchable.plain}.${type}`,
    uniqueId: String(tweets[0].id_str),
    text: tweet.full_text,
    url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
    mediaUrl: tweet.entities.media ? tweet.entities.media[0].media_url : undefined,
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
class TwitterCache {
  /**
   * Create a new Twitter self-updating cache
   * @param {EventEmitter} eventEmitter emitter to push new tweets to
   */
  constructor(eventEmitter) {
    this.emitter = eventEmitter;
    this.timeout = process.env.TWITTER_TIMEOUT || 60000;
    this.initTime = Date.now();

    const clientInfo = {
      consumer_key: process.env.TWITTER_KEY,
      consumer_secret: process.env.TWITTER_SECRET,
      bearer_token: process.env.TWITTER_BEARER_TOKEN,
    };

    this.clientInfoValid = clientInfo.consumer_key
      && clientInfo.consumer_secret
      && clientInfo.bearer_token;

    this.initClient(clientInfo);
  }

  initClient(clientInfo) {
    try {
      if (this.clientInfoValid) {
        this.client = new Twitter(clientInfo);

        // don't attempt anything else if authentication fails
        this.toWatch = toWatch;
        this.currentData = null;
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
   * @returns {Promise} the currently updating promise.
   */
  async update() {
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
   * @returns {Promise.<Array.<Object>>} Twieets
   */
  async getParseableData() {
    logger.silly('Starting Twitter update...');
    const parsedData = [];
    try {
      for (const watchable of this.toWatch) {
        const tweets = await this.client.get('statuses/user_timeline', {
          screen_name: watchable.acc_name,
          tweet_mode: 'extended',
          count: 1,
        });
        const tweet = parseTweet(tweets, watchable);
        parsedData.push(tweet);

        if (tweet.createdAt.getTime() > this.lastUpdated) {
          this.emitter.emit('tweet', tweet);
        }
      }
    } catch (error) {
      this.onError(error);
    }
    this.lastUpdated = Date.now();
    return parsedData;
  }

  /**
   * Handle errors that arise while fetching data from twitter
   * @param  {[type]} error twitter error
   */
  onError(error) {
    if (error[0] && error[0].code === 32) {
      this.clientInfoValid = false;
      logger.info('wiping twitter client data, could not authenticate...');
    } else {
      logger.debug(JSON.stringify(error));
    }
  }

  /**
   * Get the current data or a promise with the current data
   * @returns {Promise.<Object> | Object} either the current data
   *  if it's not updating, or the promise returning the new data
   */
  async getData() {
    if (!this.clientInfoValid) return undefined;

    if (this.updating) {
      return this.updating;
    }
    return this.currentData;
  }
}

module.exports = TwitterCache;
