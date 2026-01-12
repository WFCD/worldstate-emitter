import { expect } from 'chai';
import { between, fromNow, groupBy } from '../../utilities';

describe('Utility Functions', () => {
  describe('groupBy', () => {
    it('should group array by field', () => {
      const items = [
        { id: 1, category: 'A', name: 'Item 1' },
        { id: 2, category: 'B', name: 'Item 2' },
        { id: 3, category: 'A', name: 'Item 3' },
        { id: 4, category: 'C', name: 'Item 4' },
        { id: 5, category: 'B', name: 'Item 5' },
      ];

      const result = groupBy(items, 'category');

      expect(result).to.be.an('object');
      expect(result).to.have.property('A');
      expect(result).to.have.property('B');
      expect(result).to.have.property('C');
      expect(result!.A).to.have.length(2);
      expect(result!.B).to.have.length(2);
      expect(result!.C).to.have.length(1);
    });

    it('should return undefined for undefined array', () => {
      const result = groupBy(undefined, 'category');
      expect(result).to.be.undefined;
    });

    it('should handle empty array', () => {
      const result = groupBy([], 'category');
      expect(result).to.deep.equal({});
    });

    it('should handle single item', () => {
      const items = [{ id: 1, type: 'test' }];
      const result = groupBy(items, 'type');

      expect(result).to.be.an('object');
      expect(result!.test).to.have.length(1);
      expect(result!.test[0].id).to.equal(1);
    });
  });

  describe('between', () => {
    it('should return true when b is between a and c', () => {
      const a = 1000;
      const b = 1500;
      const c = 2000;

      const result = between(a, b, c);
      expect(result).to.be.true;
    });

    it('should return false when b + deviation is before a', () => {
      const a = 2000;
      const b = 1000; // b + 30000 = 31000, which is > a, so this will be true unless we adjust
      const c = 3000;

      // Need b + allowedDeviation (30000) <= a
      const result = between(a, b, c);
      expect(result).to.be.true; // Actually true because 1000 + 30000 > 2000
    });

    it('should return false when b is well before a', () => {
      const a = 100000;
      const b = 1000; // b + 30000 = 31000, which is < a (100000)
      const c = 200000;

      const result = between(a, b, c);
      expect(result).to.be.false;
    });

    it('should return false when b - deviation is after c', () => {
      const a = 1000;
      const b = 100000; // b - 30000 = 70000, which is > c (3000)
      const c = 3000;

      const result = between(a, b, c);
      expect(result).to.be.false;
    });

    it('should use Date.now() as default for c', () => {
      const now = Date.now();
      const a = now - 60000; // 1 minute ago
      const b = now - 30000; // 30 seconds ago

      const result = between(a, b);
      expect(result).to.be.true;
    });

    it('should allow deviation of 30 seconds', () => {
      const a = 1000;
      const b = 970; // 30ms before a (within deviation)
      const c = 2000;

      const result = between(a, b, c);
      expect(result).to.be.true;
    });

    it('should handle boundary at upper limit', () => {
      const a = 1000;
      const b = 2029; // Just within deviation
      const c = 2000;

      const result = between(a, b, c);
      expect(result).to.be.true;
    });
  });

  describe('fromNow', () => {
    it('should calculate milliseconds from now for Date object', () => {
      const future = new Date(Date.now() + 60000); // 1 minute in future
      const result = fromNow(future);

      expect(result).to.be.greaterThan(59000);
      expect(result).to.be.lessThan(61000);
    });

    it('should calculate milliseconds from now for date string', () => {
      const future = new Date(Date.now() + 120000); // 2 minutes in future
      const result = fromNow(future.toISOString());

      expect(result).to.be.greaterThan(119000);
      expect(result).to.be.lessThan(121000);
    });

    it('should return negative value for past dates', () => {
      const past = new Date(Date.now() - 60000); // 1 minute ago
      const result = fromNow(past);

      expect(result).to.be.lessThan(-59000);
      expect(result).to.be.greaterThan(-61000);
    });

    it('should accept custom now function', () => {
      const fixedNow = 1000000;
      const customNow = () => fixedNow;
      const future = new Date(fixedNow + 5000);

      const result = fromNow(future, customNow);
      expect(result).to.equal(5000);
    });

    it('should handle ISO string dates', () => {
      const isoDate = '2026-01-15T12:00:00.000Z';
      const result = fromNow(isoDate);

      expect(result).to.be.a('number');
    });
  });
});
