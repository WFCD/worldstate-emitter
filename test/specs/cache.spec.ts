import { expect } from 'chai';
import { createMockCache } from '../helpers/mocks';

describe('Cache Utility', () => {
  describe('get()', () => {
    it('should return cached data', async () => {
      const cache = createMockCache('test data');

      const data = await cache.get!();
      expect(data).to.equal('test data');
    });

    it('should return empty string when no data', async () => {
      const cache = createMockCache();

      const data = await cache.get!();
      expect(data).to.equal('');
    });
  });

  describe('update event', () => {
    it('should emit update event when data changes', (done) => {
      const cache = createMockCache('initial');

      cache.on!('update', (data: string) => {
        expect(data).to.equal('updated');
        done();
      });

      (cache as { trigger: (data: string) => void }).trigger('updated');
    });

    it('should update cached data on trigger', async () => {
      const cache = createMockCache('initial');

      (cache as { trigger: (data: string) => void }).trigger('updated');

      const data = await cache.get!();
      expect(data).to.equal('updated');
    });

    it('should handle multiple update listeners', (done) => {
      const cache = createMockCache('initial');
      let count = 0;

      const checkDone = () => {
        count++;
        if (count === 2) done();
      };

      cache.on!('update', () => checkDone());
      cache.on!('update', () => checkDone());

      (cache as { trigger: (data: string) => void }).trigger('updated');
    });
  });

  describe('error scenarios', () => {
    it('should handle rapid updates', (done) => {
      const cache = createMockCache('initial');
      let updateCount = 0;

      cache.on!('update', () => {
        updateCount++;
        if (updateCount === 3) {
          expect(updateCount).to.equal(3);
          done();
        }
      });

      (cache as { trigger: (data: string) => void }).trigger('update1');
      (cache as { trigger: (data: string) => void }).trigger('update2');
      (cache as { trigger: (data: string) => void }).trigger('update3');
    });
  });
});
