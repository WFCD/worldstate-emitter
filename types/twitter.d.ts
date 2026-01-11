/**
 * Extended type definitions for Twitter API responses
 * The 'twitter' package's @types/twitter only provides basic client types,
 * so we extend them here with detailed response types for Status, MediaEntity, etc.
 */

declare module 'twitter' {
  import type { EventEmitter } from 'node:events';
  import request = require('request');

  // Re-export the Twitter class as a named export for ES module usage
  export interface TwitterClient {
    readonly VERSION: string;
    readonly allow_promise: boolean;
    readonly request: typeof request;

    get(path: string, params: RequestParams, callback: Callback): void;
    get(path: string, callback: Callback): void;
    get(path: string, params?: RequestParams): Promise<ResponseData>;

    post(path: string, params: RequestParams, callback: Callback): void;
    post(path: string, callback: Callback): void;
    post(path: string, params?: RequestParams): Promise<ResponseData>;

    stream(
      method: 'user' | 'site' | string,
      // biome-ignore lint/suspicious/noExplicitAny: Twitter streaming API accepts dynamic parameters
      params: { [key: string]: any },
      callback: (stream: EventEmitter) => void,
    ): void;
    stream(method: 'user' | 'site' | string, callback: (stream: EventEmitter) => void): void;
    // biome-ignore lint/suspicious/noExplicitAny: Twitter streaming API accepts dynamic parameters
    stream(method: 'user' | 'site' | string, params?: { [key: string]: any }): EventEmitter;
  }

  export interface Options {
    consumer_key: string;
    consumer_secret: string;
    rest_base?: string;
    stream_base?: string;
    user_stream_base?: string;
    site_stream_base?: string;
    media_base?: string;
    request_options?: request.CoreOptions;
  }

  export interface AccessTokenOptions extends Options {
    access_token_key: string;
    access_token_secret: string;
  }

  export interface BearerTokenOptions extends Options {
    bearer_token: string;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Twitter API callback follows Node.js error-first convention with dynamic response data
  export type Callback = (error: any, data: ResponseData, response: request.Response) => void;

  export interface RequestParams {
    // biome-ignore lint/suspicious/noExplicitAny: Twitter API accepts dynamic query parameters
    [key: string]: any;
    base?: string;
  }

  export interface ResponseData {
    // biome-ignore lint/suspicious/noExplicitAny: Twitter API returns dynamic response data structures
    [key: string]: any;
  }

  // Twitter API response types that @types/twitter doesn't provide

  export interface MediaEntity {
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
      large: { w: number; h: number; resize: string };
      medium: { w: number; h: number; resize: string };
      small: { w: number; h: number; resize: string };
    };
  }

  export interface User {
    id: number;
    id_str: string;
    name: string;
    screen_name: string;
    location: string;
    description: string;
    url: string;
    profile_image_url: string;
    profile_image_url_https: string;
    [key: string]: unknown;
  }

  export interface Status {
    created_at: string;
    id: number;
    id_str: string;
    text: string;
    full_text?: string;
    truncated: boolean;
    entities: {
      hashtags: unknown[];
      symbols: unknown[];
      user_mentions: unknown[];
      urls: unknown[];
      media?: MediaEntity[];
    };
    user: User;
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
    quoted_status?: Status;
    retweeted_status?: Status;
    [key: string]: unknown;
  }

  // Constructor interface
  export interface TwitterConstructor {
    new (options: AccessTokenOptions | BearerTokenOptions): TwitterClient;
    (options: AccessTokenOptions | BearerTokenOptions): TwitterClient;
  }

  // Default export as constructor
  const Twitter: TwitterConstructor;
  export default Twitter;
}
