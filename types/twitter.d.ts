declare module 'twitter' {
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

  export interface Options {
    consumer_key: string;
    consumer_secret: string;
    access_token_key?: string;
    access_token_secret?: string;
    bearer_token?: string;
  }

  export default class Twitter {
    constructor(options: Options);
    get(path: string, params?: unknown): Promise<unknown>;
    post(path: string, params?: unknown): Promise<unknown>;
    stream(path: string, params?: unknown): unknown;
  }
}
