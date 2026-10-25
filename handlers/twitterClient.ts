import type { Status } from '@/handlers/twitterTypes';

const API = 'https://api.x.com/2';

interface V2User {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface V2Media {
  media_key: string;
  url?: string;
  preview_image_url?: string;
}

interface V2Tweet {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  attachments?: { media_keys?: string[] };
  referenced_tweets?: { type: 'retweeted' | 'quoted' | 'replied_to'; id: string }[];
}

interface V2Includes {
  users?: V2User[];
  tweets?: V2Tweet[];
  media?: V2Media[];
}

interface V2Timeline {
  data?: V2Tweet[];
  includes?: V2Includes;
}

interface V2ErrorBody {
  title?: string;
  detail?: string;
}

const TWEET_QUERY = {
  max_results: '5',
  'tweet.fields': 'created_at,referenced_tweets,attachments,author_id',
  expansions: 'author_id,referenced_tweets.id,referenced_tweets.id.author_id,attachments.media_keys',
  'media.fields': 'url,preview_image_url,type',
  'user.fields': 'name,username,profile_image_url',
};

const authFailure = (body: V2ErrorBody | undefined): { code: number; message: string }[] => [
  { code: 32, message: body?.detail || body?.title || 'Could not authenticate' },
];

async function request<T>(bearer: string, path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  const body = (await response.json().catch(() => undefined)) as (T & V2ErrorBody) | undefined;

  if (response.status === 401 || response.status === 403) {
    throw authFailure(body);
  }
  if (!response.ok || !body) {
    throw new Error(`Twitter API ${response.status}`);
  }
  return body;
}

const toStatus = (tweet: V2Tweet, includes: V2Includes | undefined, seen = new Set<string>()): Status => {
  const author = includes?.users?.find((user) => user.id === tweet.author_id);
  const mediaKey = tweet.attachments?.media_keys?.[0];
  const media = includes?.media?.find((item) => item.media_key === mediaKey);
  const mediaUrl = media?.url || media?.preview_image_url;
  const ref = (type: 'retweeted' | 'quoted' | 'replied_to') =>
    tweet.referenced_tweets?.find((item) => item.type === type);
  const replied = ref('replied_to');
  const quoted = ref('quoted');
  const retweeted = ref('retweeted');

  seen.add(tweet.id);
  const nested = (id?: string): Status | undefined => {
    if (!id || seen.has(id)) return undefined;
    const match = includes?.tweets?.find((item) => item.id === id);
    return match ? toStatus(match, includes, seen) : undefined;
  };

  return {
    created_at: tweet.created_at ?? new Date(0).toISOString(),
    id_str: tweet.id,
    text: tweet.text,
    full_text: tweet.text,
    entities: mediaUrl ? { media: [{ media_url: mediaUrl }] } : { media: undefined },
    user: {
      name: author?.name ?? '',
      screen_name: author?.username ?? '',
      profile_image_url: author?.profile_image_url,
    },
    in_reply_to_status_id: replied?.id,
    quoted_status_id: quoted?.id,
    quoted_status: nested(quoted?.id),
    retweeted_status: nested(retweeted?.id),
  };
};

/**
 * App-only X API v2 client. Replaces the unmaintained `twitter` package.
 */
export class XTimelineClient {
  private readonly userIds = new Map<string, string>();

  constructor(private readonly bearer: string) {}

  async get(_path: string, params?: Record<string, string | number>): Promise<Status[]> {
    const screenName = String(params?.screen_name ?? '');
    if (!screenName) return [];

    const userId = await this.userId(screenName);
    const timeline = await request<V2Timeline>(this.bearer, `/users/${userId}/tweets`, TWEET_QUERY);
    const latest = timeline.data?.[0];
    return latest ? [toStatus(latest, timeline.includes)] : [];
  }

  private async userId(screenName: string): Promise<string> {
    const cached = this.userIds.get(screenName);
    if (cached) return cached;

    const lookup = await request<{ data?: { id: string } }>(
      this.bearer,
      `/users/by/username/${encodeURIComponent(screenName)}`,
    );
    const id = lookup.data?.id;
    if (!id) throw new Error(`No Twitter user ${screenName}`);

    this.userIds.set(screenName, id);
    return id;
  }
}
