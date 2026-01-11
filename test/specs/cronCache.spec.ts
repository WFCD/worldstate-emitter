import { expect } from 'chai';
import CronCache from '../../utilities/Cache';

describe('CronCache', () => {
  // Use a mock server URL that will fail
  const mockUrl = 'https://httpbin.org/status/200';
  const failUrl = 'https://httpbin.org/status/500';

  describe('constructor', () => {
    it('should create a cache instance', () => {
      const cache = new CronCache(mockUrl);
      expect(cache).to.be.instanceOf(CronCache);
    });

    it('should accept custom cron pattern', () => {
      const cache = new CronCache(mockUrl, '0 */5 * * * *');
      expect(cache).to.be.instanceOf(CronCache);
    });
  });

  describe('get()', () => {
    it('should fetch data when cache is empty', async function () {
      this.timeout(10000); // Increase timeout for network request
      const cache = new CronCache(mockUrl);
      const data = await cache.get();
      expect(data).to.be.a('string');
    });

    it('should return in-progress update when updating', async function () {
      this.timeout(10000);
      const cache = new CronCache(mockUrl);

      // Trigger get() twice quickly - second call should return in-progress promise
      const promise1 = cache.get();
      const promise2 = cache.get();

      const [data1, data2] = await Promise.all([promise1, promise2]);
      expect(data1).to.equal(data2);
    });

    it('should return cached data on subsequent calls', async function () {
      this.timeout(10000);
      const cache = new CronCache(mockUrl);

      const data1 = await cache.get();
      const data2 = await cache.get();

      expect(data1).to.equal(data2);
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async function () {
      this.timeout(10000);
      // Use an invalid URL that will cause a network error
      const cache = new CronCache('https://invalid-domain-that-does-not-exist-12345.com/test');

      try {
        const data = await cache.get();
        // If it doesn't throw, data should be undefined
        expect(data).to.be.undefined;
      } catch (error) {
        // Catch block in case the promise rejects
        expect(error).to.exist;
      }
    });

    it.skip('should emit update event on successful fetch', async function () {
      this.timeout(10000);

      // Use CronCache.make() which calls #update() immediately
      // and will emit the update event
      let updateReceived = false;
      let receivedData: string | undefined;

      // We need to set up listener before make() completes
      // So we'll create with constructor and force an update via get() when empty
      const cache = new CronCache(mockUrl);

      const promise = new Promise<void>((resolve) => {
        cache.on('update', (data) => {
          receivedData = data as string;
          updateReceived = true;
          resolve();
        });
      });

      // Call get() which will trigger #update() since data is initially empty
      await cache.get();

      // Wait for update event (with timeout)
      await Promise.race([promise, new Promise((resolve) => setTimeout(resolve, 5000))]);

      expect(updateReceived).to.be.true;
      expect(receivedData).to.be.a('string');
    });

    it('should not emit update event on failed fetch', async function () {
      this.timeout(10000);
      const cache = new CronCache('https://invalid-domain-that-does-not-exist-12345.com/test');

      let eventEmitted = false;
      cache.on('update', () => {
        eventEmitted = true;
      });

      try {
        await cache.get();
      } catch {
        // Ignore fetch errors
      }

      // Wait a bit to ensure event would have been emitted
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(eventEmitted).to.be.false;
    });
  });

  describe('static make()', () => {
    it('should create and initialize cache', async function () {
      this.timeout(10000);
      const cache = await CronCache.make(mockUrl);

      expect(cache).to.be.instanceOf(CronCache);

      // Cache should already have data
      const data = await cache.get();
      expect(data).to.be.a('string');
    });

    it('should accept custom pattern', async function () {
      this.timeout(10000);
      const cache = await CronCache.make(mockUrl, '0 */5 * * * *');

      expect(cache).to.be.instanceOf(CronCache);
    });
  });
});
