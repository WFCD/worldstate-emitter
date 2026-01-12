import { expect } from 'chai';
import type { ExternalMission, Fissure, PersistentEnemy, WorldStateObject } from 'warframe-worldstate-parser';
import * as eKeyOverrides from '../../handlers/events/eKeyOverrides';

describe('Event Key Overrides', () => {
  describe('fissures', () => {
    it('should generate key from tier and mission type', () => {
      const fissure = {
        tierNum: 3,
        missionType: 'Capture',
      } as Fissure;

      const result = eKeyOverrides.fissures(fissure as WorldStateObject);
      expect(result).to.equal('fissures.t3.capture');
    });

    it('should handle undefined mission type', () => {
      const fissure = {
        tierNum: 5,
        missionType: undefined,
      } as unknown as Fissure;

      const result = eKeyOverrides.fissures(fissure as WorldStateObject);
      expect(result).to.equal('fissures.t5.');
    });

    it('should convert mission type to lowercase', () => {
      const fissure = {
        tierNum: 1,
        missionType: 'EXTERMINATE',
      } as Fissure;

      const result = eKeyOverrides.fissures(fissure as WorldStateObject);
      expect(result).to.equal('fissures.t1.exterminate');
    });
  });

  describe('enemies', () => {
    it('should return key for discovered enemy', () => {
      const enemy = {
        isDiscovered: true,
        lastDiscoveredAt: new Date('2024-01-01T00:00:00Z'),
      } as unknown as PersistentEnemy;

      const result = eKeyOverrides.enemies(enemy as WorldStateObject);
      expect(result).to.be.an('object');
      expect(result.eventKey).to.equal('enemies');
      expect(result.activation).to.be.instanceOf(Date);
      expect(result.activation.toISOString()).to.equal('2024-01-01T00:00:00.000Z');
    });

    it('should return key with .departed for undiscovered enemy', () => {
      const enemy = {
        isDiscovered: false,
        lastDiscoveredAt: new Date('2024-01-02T12:00:00Z'),
      } as unknown as PersistentEnemy;

      const result = eKeyOverrides.enemies(enemy as WorldStateObject);
      expect(result).to.be.an('object');
      expect(result.eventKey).to.equal('enemies.departed');
      expect(result.activation).to.be.instanceOf(Date);
      expect(result.activation.toISOString()).to.equal('2024-01-02T12:00:00.000Z');
    });
  });

  describe('arbitration', () => {
    it('should generate key from enemy and type', () => {
      const arbi = {
        enemy: 'Grineer',
        type: 'Defense',
      } as ExternalMission;

      const result = eKeyOverrides.arbitration(arbi as unknown as WorldStateObject);
      expect(result).to.equal('arbitration.grineer.defense');
    });

    it('should handle type with spaces', () => {
      const arbi = {
        enemy: 'Corpus',
        type: 'Mobile Defense',
      } as ExternalMission;

      const result = eKeyOverrides.arbitration(arbi as unknown as WorldStateObject);
      expect(result).to.equal('arbitration.corpus.mobiledefense');
    });

    it('should convert enemy to lowercase', () => {
      const arbi = {
        enemy: 'INFESTED',
        type: 'Survival',
      } as ExternalMission;

      const result = eKeyOverrides.arbitration(arbi as unknown as WorldStateObject);
      expect(result).to.equal('arbitration.infested.survival');
    });

    it('should return empty string if enemy is missing', () => {
      const arbi = {
        type: 'Defense',
      } as ExternalMission;

      const result = eKeyOverrides.arbitration(arbi as unknown as WorldStateObject);
      expect(result).to.equal('');
    });

    it('should return empty string on parsing error', () => {
      const arbi = {
        enemy: 'Grineer',
        type: null,
      } as unknown as ExternalMission;

      const result = eKeyOverrides.arbitration(arbi as unknown as WorldStateObject);
      expect(result).to.equal('');
    });
  });

  describe('constant overrides', () => {
    it('should export events as "operations"', () => {
      expect(eKeyOverrides.events).to.equal('operations');
    });

    it('should export persistentEnemies as "enemies"', () => {
      expect(eKeyOverrides.persistentEnemies).to.equal('enemies');
    });
  });

  describe('overrides map', () => {
    it('should export all overrides in a map', () => {
      expect(eKeyOverrides.overrides).to.be.an('object');
      expect(eKeyOverrides.overrides).to.have.property('fissures');
      expect(eKeyOverrides.overrides).to.have.property('enemies');
      expect(eKeyOverrides.overrides).to.have.property('arbitration');
      expect(eKeyOverrides.overrides).to.have.property('events');
      expect(eKeyOverrides.overrides).to.have.property('persistentEnemies');
    });

    it('should have function overrides as functions', () => {
      expect(eKeyOverrides.overrides.fissures).to.be.a('function');
      expect(eKeyOverrides.overrides.enemies).to.be.a('function');
      expect(eKeyOverrides.overrides.arbitration).to.be.a('function');
    });

    it('should have constant overrides as strings', () => {
      expect(eKeyOverrides.overrides.events).to.be.a('string');
      expect(eKeyOverrides.overrides.persistentEnemies).to.be.a('string');
    });
  });
});
