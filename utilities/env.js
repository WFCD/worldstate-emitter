// eslint-disable-next-line import/prefer-default-export
export const LOG_LEVEL = process?.env?.LOG_LEVEL || 'error';

export const twiClientInfo = {
  consumer_key: process?.env?.TWITTER_KEY,
  consumer_secret: process?.env?.TWITTER_SECRET,
  bearer_token: process?.env?.TWITTER_BEARER_TOKEN,
};

export const TWITTER_TIMEOUT = process?.env?.TWITTER_TIMEOUT || 60000;
