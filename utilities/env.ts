export const LOG_LEVEL = (process?.env?.LOG_LEVEL as string) || 'error';

export const twiClientInfo = {
  consumer_key: process?.env?.TWITTER_KEY,
  consumer_secret: process?.env?.TWITTER_SECRET,
  bearer_token: process?.env?.TWITTER_BEARER_TOKEN,
};

export const TWITTER_TIMEOUT = Number(process?.env?.TWITTER_TIMEOUT) || 60000;
