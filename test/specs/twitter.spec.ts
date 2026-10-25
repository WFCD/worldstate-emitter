import { expect } from 'chai';
import TwitterCache from '@/handlers/Twitter';
import { XTimelineClient } from '@/handlers/twitterClient';
import {
  mockQuoteTweet,
  mockReplyTweet,
  mockRetweet,
  mockTweet,
  mockTweetWithMedia,
  mockTwitterClientInfo,
  mockWatchable,
} from '../fixtures/twitter';
import { createMockEmitter } from '../helpers/mocks';

// Mock TwitterClient interface
interface MockTwitterClient {
  get: (endpoint: string, params: unknown) => Promise<unknown>;
}

describe('Twitter Handler', () => {
  describe('constructor', () => {
    it('should initialize with an event emitter', () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, { autoStart: false });

      expect(twitter).to.be.instanceOf(TwitterCache);
    });

    it('should validate client info', () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
      });

      expect(twitter.clientInfoValid).to.be.true;
    });

    it('should mark client as invalid with missing credentials', () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: { consumer_key: 'test' }, // Missing other credentials
      });

      expect(twitter.clientInfoValid).to.be.false;
    });

    it('should accept custom timeout', () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        timeout: 5000,
      });

      expect(twitter).to.be.instanceOf(TwitterCache);
    });

    it('should accept custom watch list', () => {
      const emitter = createMockEmitter();
      const customWatchList = [{ acc_name: 'TestAccount', plain: 'testaccount' }];
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        watchList: customWatchList,
      });

      expect(twitter).to.be.instanceOf(TwitterCache);
    });
  });

  describe('getData', () => {
    it('should return undefined for invalid client', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: {},
      });

      const data = await twitter.getData();
      expect(data).to.be.undefined;
    });

    it('should return empty array when no data is cached', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
      });

      const data = await twitter.getData();
      expect(data).to.be.an('array');
      expect(data).to.have.length(0);
    });
  });

  describe('update', () => {
    it('should return undefined for invalid client', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: {},
      });

      const result = await twitter.update();
      expect(result).to.be.undefined;
    });

    it('should return undefined when no watch list', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [],
      });

      // Set client but no watch list
      const mockClient = {
        get: () => Promise.resolve([mockTweet]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      const result = await twitter.update();
      expect(result).to.be.undefined;
    });

    it('should fetch and parse tweets', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.resolve([mockTweet]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      const result = await twitter.update();

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result![0]).to.have.property('id');
      expect(result![0]).to.have.property('text');
      expect(result![0]).to.have.property('author');
    });

    it('should emit tweet event for new tweets', (done) => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.resolve([mockTweet]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      emitter.on('tweet', (data) => {
        expect(data).to.be.an('object');
        expect(data).to.have.property('text');
        expect(data).to.have.property('author');
        done();
      });

      twitter.update();
    });

    it('should parse tweet with media', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.resolve([mockTweetWithMedia]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      const result = await twitter.update();

      expect(result).to.be.an('array');
      expect(result![0]).to.have.property('mediaUrl');
      expect(result![0].mediaUrl).to.equal('https://pbs.twimg.com/media/test_image.jpg');
    });

    it('should parse reply tweet', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.resolve([mockReplyTweet]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      const result = await twitter.update();

      expect(result).to.be.an('array');
      expect(result![0]).to.have.property('isReply');
      expect(result![0].isReply).to.be.true;
      expect(result![0].id).to.include('reply');
    });

    it('should parse quote tweet', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.resolve([mockQuoteTweet]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      const result = await twitter.update();

      expect(result).to.be.an('array');
      expect(result![0]).to.have.property('quote');
      expect(result![0].quote).to.be.an('object');
      expect(result![0].quote!.text).to.equal('Original quoted tweet full text');
      expect(result![0].id).to.include('quote');
    });

    it('should parse retweet', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.resolve([mockRetweet]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      const result = await twitter.update();

      expect(result).to.be.an('array');
      expect(result![0]).to.have.property('retweet');
      expect(result![0].retweet).to.be.an('object');
      expect(result![0].retweet!.text).to.equal('Original tweet text full');
      expect(result![0].id).to.include('retweet');
    });

    it('should handle Twitter API errors gracefully', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.reject(new Error('API Error')),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      // Should not throw
      const result = await twitter.update();
      expect(result).to.be.an('array');
    });

    it('should handle authentication errors', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.reject([{ code: 32, message: 'Could not authenticate' }]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      await twitter.update();

      // Should dispose client on auth error
      expect(twitter.clientInfoValid).to.be.false;
    });
  });

  describe('dispose', () => {
    it('should clear interval and reset state', () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
      });

      twitter.dispose();

      expect(twitter.clientInfoValid).to.be.false;
    });

    it('should be callable multiple times', () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
      });

      expect(() => {
        twitter.dispose();
        twitter.dispose();
        twitter.dispose();
      }).to.not.throw();
    });
  });

  describe('author parsing', () => {
    it('should extract author information correctly', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.resolve([mockTweet]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      const result = await twitter.update();

      expect(result![0].author).to.deep.include({
        name: 'Warframe',
        handle: 'PlayWarframe',
        url: 'https://twitter.com/PlayWarframe',
      });
    });

    it('should upgrade avatar URL to full size', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.resolve([mockTweet]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      const result = await twitter.update();

      expect(result![0].author.avatar).to.not.include('_normal.jpg');
      expect(result![0].author.avatar).to.include('.jpg');
    });
  });

  describe('unique ID generation', () => {
    it('should generate unique IDs for different tweet types', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const tweets = [mockTweet, mockReplyTweet, mockQuoteTweet, mockRetweet];
      const ids: string[] = [];

      for (const tweet of tweets) {
        const mockClient = {
          get: () => Promise.resolve([tweet]),
        } as unknown as MockTwitterClient;
        twitter.setClient(mockClient as never);

        const result = await twitter.update();
        if (result && result[0]) {
          ids.push(result[0].id);
        }
      }

      // All IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).to.equal(ids.length);
    });
  });

  describe('X API v2 client', () => {
    const originalFetch = globalThis.fetch;
    const timeline = {
      data: [
        {
          id: '9001',
          text: 'v2 tweet',
          created_at: '2026-01-02T00:00:00.000Z',
          author_id: '42',
          attachments: { media_keys: ['3_1'] },
          referenced_tweets: [{ type: 'quoted', id: '8001' }],
        },
      ],
      includes: {
        users: [
          {
            id: '42',
            name: 'Warframe',
            username: 'PlayWarframe',
            profile_image_url: 'https://pbs.twimg.com/profile_images/123/test_normal.jpg',
          },
          { id: '7', name: 'Other User', username: 'OtherUser' },
        ],
        tweets: [
          {
            id: '8001',
            text: 'Original quoted tweet full text',
            created_at: '2026-01-01T00:00:00.000Z',
            author_id: '7',
          },
        ],
        media: [{ media_key: '3_1', type: 'photo', url: 'https://pbs.twimg.com/media/test_image.jpg' }],
      },
    };

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should map a v2 timeline onto the existing tweet shape', async () => {
      const urls: string[] = [];
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const url = String(input);
        urls.push(url);
        if (url.includes('/users/by/username/PlayWarframe')) {
          return Response.json({ data: { id: '42' } });
        }
        return Response.json(timeline);
      }) as typeof fetch;

      const client = new XTimelineClient('test_bearer_token');
      const [tweet] = await client.get('statuses/user_timeline', { screen_name: 'PlayWarframe' });
      expect(tweet).to.exist;
      if (!tweet) return;

      expect(urls[0]).to.include('https://api.x.com/2/users/by/username/PlayWarframe');
      expect(urls[1]).to.include('https://api.x.com/2/users/42/tweets');
      expect(tweet.user.screen_name).to.equal('PlayWarframe');
      expect(tweet.entities.media?.[0].media_url).to.equal('https://pbs.twimg.com/media/test_image.jpg');
      expect(tweet.quoted_status?.text).to.equal('Original quoted tweet full text');
      expect(tweet.quoted_status?.user.screen_name).to.equal('OtherUser');
    });

    it('should reuse the resolved user id', async () => {
      let calls = 0;
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        calls += 1;
        const url = String(input);
        if (url.includes('/users/by/username/')) return Response.json({ data: { id: '42' } });
        return Response.json({ data: [] });
      }) as typeof fetch;

      const client = new XTimelineClient('test_bearer_token');
      await client.get('statuses/user_timeline', { screen_name: 'PlayWarframe' });
      await client.get('statuses/user_timeline', { screen_name: 'PlayWarframe' });

      expect(calls).to.equal(3);
    });

    it('should surface auth failure as code 32', async () => {
      globalThis.fetch = (async () =>
        Response.json({ title: 'Unauthorized', status: 401 }, { status: 401 })) as typeof fetch;

      const client = new XTimelineClient('bad');
      try {
        await client.get('statuses/user_timeline', { screen_name: 'PlayWarframe' });
        expect.fail('expected auth error');
      } catch (error) {
        expect(error).to.deep.equal([{ code: 32, message: 'Unauthorized' }]);
      }
    });
  });

  describe('data caching', () => {
    it('should cache data after successful update', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      const mockClient = {
        get: () => Promise.resolve([mockTweet]),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      // First update should fetch data
      const result1 = await twitter.update();
      expect(result1).to.be.an('array');
      expect(result1).to.have.length(1);

      // getData should return cached data
      const cachedData = await twitter.getData();
      expect(cachedData).to.be.an('array');
      expect(cachedData).to.have.length(1);
      expect(cachedData![0]).to.deep.equal(result1![0]);
    });

    it('should return updating promise when update is in progress', async () => {
      const emitter = createMockEmitter();
      const twitter = new TwitterCache(emitter, {
        autoStart: false,
        clientInfo: mockTwitterClientInfo,
        watchList: [mockWatchable],
      });

      let resolveGet: ((value: unknown) => void) | undefined;
      const mockClient = {
        get: () =>
          new Promise((resolve) => {
            resolveGet = resolve;
            // Resolve after a delay to simulate slow API
            setTimeout(() => resolve([mockTweet]), 50);
          }),
      } as unknown as MockTwitterClient;
      twitter.setClient(mockClient as never);

      // Start update without awaiting
      const updatePromise = twitter.update();

      // Call getData while update is in progress
      const dataPromise = twitter.getData();

      // Both should return the same data
      const [updateResult, dataResult] = await Promise.all([updatePromise, dataPromise]);
      expect(updateResult).to.deep.equal(dataResult);
    });
  });
});
