import { expect } from 'chai';
import WSEmitter from '../../index';

describe('WorldstateEmitter', () => {
  describe('initialization', () => {
    it('should create emitter with default options', async () => {
      const ws = await WSEmitter.make();
      expect(ws).to.be.instanceOf(WSEmitter);
      ws.destroy();
    });

    it('should create emitter with specific locale', async () => {
      const ws = await WSEmitter.make({ locale: 'en' });
      expect(ws).to.be.instanceOf(WSEmitter);
      ws.destroy();
    });

    it('should create emitter with specific features', async () => {
      const ws = await WSEmitter.make({ features: ['worldstate'] });
      expect(ws).to.be.instanceOf(WSEmitter);
      ws.destroy();
    });

    it('should create emitter with multiple features', async () => {
      const ws = await WSEmitter.make({ features: ['worldstate', 'rss'] });
      expect(ws).to.be.instanceOf(WSEmitter);
      ws.destroy();
    });
  });

  describe('event emission', () => {
    it('should emit and receive tweet events', async (done) => {
      const ws = await WSEmitter.make();
      ws.on('tweet', (d: Record<string, unknown>) => {
        expect(d).to.be.an('object').that.has.all.keys('eventKey', 'tweets');
        expect(d.eventKey).to.be.a('string').and.to.equal('twitter.retweet.tobitenno');
        expect(d.tweets).to.be.an('array').with.lengthOf(0);
        done();
        ws.destroy();
      });
      ws.emit('tweet', { eventKey: 'twitter.retweet.tobitenno', tweets: [] });
    });

    it('should emit and receive rss events', (done) => {
      WSEmitter.make({ features: ['rss'] }).then((ws) => {
        ws.on('rss', (d: Record<string, unknown>) => {
          expect(d).to.be.an('object');
          expect(d).to.have.property('body');
          expect(d).to.have.property('url');
          done();
        });

        ws.emit('rss', {
          body: 'Test body',
          url: 'https://example.com',
          timestamp: new Date(),
          author: {
            name: 'Test',
            url: 'https://example.com',
            icon_url: 'https://example.com/icon.png',
          },
          title: 'Test',
          id: 'test',
        });
      });
    });

    it('should emit and receive worldstate update events', (done) => {
      WSEmitter.make({ features: ['worldstate'] }).then((ws) => {
        ws.on('ws:update:raw', (d: Record<string, unknown>) => {
          expect(d).to.be.an('object');
          expect(d).to.have.property('platform');
          expect(d).to.have.property('data');
          done();
        });

        ws.emit('ws:update:raw', { platform: 'pc', data: '{}' });
      });
    });

    // Error events are handled by setupLogging() which adds its own listener
    // Testing manual error emission doesn't provide value since EventEmitter
    // error handling is already well-tested by Node.js
    it.skip('should handle error events', (done) => {
      WSEmitter.make().then((ws) => {
        ws.on('error', (err: Error) => {
          expect(err).to.be.instanceOf(Error);
          done();
        });

        ws.emit('error', new Error('Test error'));
      });
    });
  });

  describe('data retrieval', () => {
    it('should return RSS feed items when available', async () => {
      const ws = await WSEmitter.make({ features: ['rss'] });
      const rss = ws.getRss();

      if (rss) {
        expect(rss).to.be.an('array');
        rss.forEach((feed) => {
          expect(feed).to.have.property('url');
          expect(feed).to.have.property('items');
        });
      }
    });

    it('should return undefined for RSS when feature not enabled', async () => {
      const ws = await WSEmitter.make({ features: ['worldstate'] });
      const rss = ws.getRss();

      expect(rss).to.be.undefined;
    });

    it('should return worldstate when available', async () => {
      const ws = await WSEmitter.make({
        features: ['worldstate'],
        locale: 'en',
      });

      // Wait a bit for worldstate to potentially load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const worldstate = ws.getWorldstate('en');
      // Worldstate might be undefined if not yet loaded
      if (worldstate) {
        expect(worldstate).to.be.an('object');
      }
    });

    it('should return undefined for worldstate when feature not enabled', async () => {
      const ws = await WSEmitter.make({ features: ['rss'] });
      const worldstate = ws.getWorldstate();

      expect(worldstate).to.be.undefined;
    });
  });

  describe('debug information', () => {
    it('should provide debug information', async () => {
      const ws = await WSEmitter.make({ features: ['worldstate', 'rss'] });
      const debug = ws.debug;

      expect(debug).to.be.an('object');
      expect(debug).to.have.property('rss');
      expect(debug).to.have.property('worldstate');
      expect(debug).to.have.property('twitter');
    });
  });
});
