export interface MediaEntity {
  media_url: string;
}

export interface TweetUser {
  name: string;
  screen_name: string;
  profile_image_url?: string;
}

export interface Status {
  created_at: string;
  id_str: string;
  text: string;
  full_text?: string;
  entities: {
    media?: MediaEntity[];
  };
  user: TweetUser;
  in_reply_to_status_id?: number | string;
  quoted_status_id?: number | string;
  quoted_status?: Status;
  retweeted_status?: Status;
}

export interface TimelineClient {
  get(path: string, params?: Record<string, string | number>): Promise<Status[]>;
}

export interface TwitterCredentials {
  consumer_key?: string;
  consumer_secret?: string;
  bearer_token?: string;
}
