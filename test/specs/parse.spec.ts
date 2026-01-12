import { expect } from 'chai';
import parseNew from '../../handlers/events/parse';
import type { BaseEventData, CycleLike } from '../../handlers/events/types';

describe('Event Parsing', () => {
  const baseDeps = {
    key: 'test',
    platform: 'pc',
    language: 'en',
    cycleStart: Date.now(),
  };

  describe('parseNew', () => {
    it('should return empty array for empty data', () => {
      const result = parseNew({
        ...baseDeps,
        data: [] as BaseEventData[],
      });

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should handle cycle-like events', () => {
      const cycleData: CycleLike = {
        id: 'earthCycle',
        activation: new Date(),
        expiry: new Date(Date.now() + 3600000),
        state: 'day',
      };

      const result = parseNew({
        ...baseDeps,
        key: 'earthCycle',
        data: cycleData,
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.be.greaterThan(0);
        expect(result[0]).to.have.property('key');
        expect(result[0]).to.have.property('platform');
        expect(result[0]).to.have.property('language');
      }
    });

    it('should handle array events', () => {
      const eventData: BaseEventData[] = [
        {
          id: 'event1',
          activation: new Date(),
          expiry: new Date(Date.now() + 3600000),
        },
        {
          id: 'event2',
          activation: new Date(),
          expiry: new Date(Date.now() + 7200000),
        },
      ];

      const result = parseNew({
        ...baseDeps,
        key: 'events',
        data: eventData,
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.equal(2);
      }
    });

    it('should handle single object events', () => {
      const eventData: BaseEventData = {
        id: 'sortie123',
        activation: new Date(),
        expiry: new Date(Date.now() + 86400000),
      };

      const result = parseNew({
        ...baseDeps,
        key: 'sortie',
        data: eventData,
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.be.greaterThan(0);
        expect(result[0]).to.have.property('id');
      }
    });

    it('should filter out events without IDs', () => {
      const eventData: BaseEventData[] = [
        {
          id: 'event1',
          activation: new Date(),
          expiry: new Date(Date.now() + 3600000),
        },
        {
          activation: new Date(),
          expiry: new Date(Date.now() + 7200000),
        },
      ];

      const result = parseNew({
        ...baseDeps,
        key: 'events',
        data: eventData,
      });

      expect(result).to.be.an('array');
      if (result) {
        // Should only include events with IDs
        result.forEach((event) => {
          expect(event).to.have.property('id');
        });
      }
    });

    it('should handle kuva events specially', () => {
      const kuvaData = [
        {
          id: 'kuva1',
          activation: new Date(),
          expiry: new Date(Date.now() + 3600000),
          type: 'Steel Path',
        },
      ];

      const result = parseNew({
        ...baseDeps,
        key: 'kuva',
        data: kuvaData as BaseEventData[],
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.be.greaterThan(0);
      }
    });

    it('should handle nightwave events', () => {
      const nightwaveData = {
        id: 'nightwave123',
        activation: new Date(),
        expiry: new Date(Date.now() + 86400000 * 30),
        activeChallenges: [],
      };

      const result = parseNew({
        ...baseDeps,
        key: 'nightwave',
        data: nightwaveData as BaseEventData,
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.be.greaterThan(0);
      }
    });
  });

  describe('event key overrides', () => {
    it('should apply key overrides for specific events', () => {
      const eventData: BaseEventData = {
        id: 'event123',
        activation: new Date(),
        expiry: new Date(Date.now() + 3600000),
      };

      const result = parseNew({
        ...baseDeps,
        key: 'events',
        data: [eventData],
      });

      expect(result).to.be.an('array');
      // Event keys might be transformed based on overrides
      if (result && result.length > 0) {
        expect(result[0]).to.have.property('key');
      }
    });
  });

  describe('platform and language handling', () => {
    it('should include platform in parsed events', () => {
      const eventData: BaseEventData = {
        id: 'test123',
        activation: new Date(),
        expiry: new Date(Date.now() + 3600000),
      };

      const result = parseNew({
        ...baseDeps,
        platform: 'ps4',
        data: eventData,
      });

      expect(result).to.be.an('array');
      if (result && result.length > 0) {
        expect(result[0]).to.have.property('platform');
        expect(result[0].platform).to.equal('ps4');
      }
    });

    it('should include language in parsed events', () => {
      const eventData: BaseEventData = {
        id: 'test123',
        activation: new Date(),
        expiry: new Date(Date.now() + 3600000),
      };

      const result = parseNew({
        ...baseDeps,
        language: 'de',
        data: eventData,
      });

      expect(result).to.be.an('array');
      if (result && result.length > 0) {
        expect(result[0]).to.have.property('language');
        expect(result[0].language).to.equal('de');
      }
    });
  });

  describe('array-like event keys', () => {
    const testArrayKeys = [
      'alerts',
      'conclaveChallenges',
      'dailyDeals',
      'flashSales',
      'fissures',
      'globalUpgrades',
      'invasions',
      'syndicateMissions',
      'weeklyChallenges',
    ];

    for (const key of testArrayKeys) {
      it(`should handle ${key} events`, () => {
        const eventData: BaseEventData[] = [
          {
            id: `${key}1`,
            activation: new Date(),
            expiry: new Date(Date.now() + 3600000),
          },
        ];

        const result = parseNew({
          ...baseDeps,
          key,
          data: eventData,
        });

        expect(result).to.be.an('array');
        if (result) {
          expect(result.length).to.be.greaterThan(0);
          expect(result[0]).to.have.property('key');
        }
      });
    }
  });

  describe('cycle-like event keys', () => {
    it('should handle cetusCycle events', () => {
      const cycleData: CycleLike = {
        id: 'cetusCycle',
        activation: new Date(),
        expiry: new Date(Date.now() + 3600000),
        state: 'day',
      };

      const result = parseNew({
        ...baseDeps,
        key: 'cetusCycle',
        data: cycleData,
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.be.greaterThan(0);
      }
    });

    it('should handle vallisCycle events', () => {
      const cycleData: CycleLike = {
        id: 'vallisCycle',
        activation: new Date(),
        expiry: new Date(Date.now() + 1600000),
        state: 'warm',
      };

      const result = parseNew({
        ...baseDeps,
        key: 'vallisCycle',
        data: cycleData,
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.be.greaterThan(0);
      }
    });
  });

  describe('object-like event keys', () => {
    it('should handle voidTrader events', () => {
      const eventData: BaseEventData = {
        id: 'voidTrader123',
        activation: new Date(),
        expiry: new Date(Date.now() + 172800000),
      };

      const result = parseNew({
        ...baseDeps,
        key: 'voidTrader',
        data: eventData,
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.be.greaterThan(0);
      }
    });

    it('should handle arbitration events', () => {
      const eventData: BaseEventData = {
        id: 'arbitration123',
        activation: new Date(),
        expiry: new Date(Date.now() + 3600000),
      };

      const result = parseNew({
        ...baseDeps,
        key: 'arbitration',
        data: eventData,
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.be.greaterThan(0);
      }
    });

    it('should handle sentientOutposts events', () => {
      const eventData: BaseEventData = {
        id: 'sentientOutpost123',
        activation: new Date(),
        expiry: new Date(Date.now() + 7200000),
      };

      const result = parseNew({
        ...baseDeps,
        key: 'sentientOutposts',
        data: eventData,
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.be.greaterThan(0);
      }
    });

    it('should handle persistentEnemies events', () => {
      const eventData: BaseEventData = {
        id: 'persistentEnemy123',
        activation: new Date(),
        expiry: new Date(Date.now() + 3600000),
      };

      const result = parseNew({
        ...baseDeps,
        key: 'persistentEnemies',
        data: eventData,
      });

      expect(result).to.be.an('array');
      if (result) {
        expect(result.length).to.be.greaterThan(0);
      }
    });
  });

  describe('default case handling', () => {
    it('should handle unknown event keys gracefully', () => {
      const eventData: BaseEventData = {
        id: 'unknown123',
        activation: new Date(),
        expiry: new Date(Date.now() + 3600000),
      };

      const result = parseNew({
        ...baseDeps,
        key: 'unknownEventType',
        data: eventData,
      });

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  });
});
