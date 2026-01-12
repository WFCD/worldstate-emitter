import { expect } from 'chai';
import checkOverrides from '../../handlers/events/checkOverrides';

describe('checkOverrides', () => {
  it('should return original key when no override exists', () => {
    const result = checkOverrides('nonExistentKey', {} as never);
    expect(result).to.equal('nonExistentKey');
  });

  it('should return string override for "events"', () => {
    // 'events' is mapped to string 'operations'
    const result = checkOverrides('events', {} as never);
    expect(result).to.be.a('string');
    expect(result).to.equal('operations');
  });

  it('should return string override for "persistentEnemies"', () => {
    // 'persistentEnemies' is mapped to string 'enemies'
    const result = checkOverrides('persistentEnemies', {} as never);
    expect(result).to.be.a('string');
    expect(result).to.equal('enemies');
  });

  it('should call fissures function override', () => {
    // 'fissures' is a function override that returns a string
    const mockData = {
      tierNum: 3,
      missionType: 'Capture',
    } as never;

    const result = checkOverrides('fissures', mockData);
    expect(result).to.be.a('string');
    expect(result).to.equal('fissures.t3.capture');
  });

  it('should call enemies function override and return object', () => {
    // 'enemies' is a function override that returns an object
    const mockData = {
      isDiscovered: true,
      lastDiscoveredAt: new Date('2026-01-11'),
    } as never;

    const result = checkOverrides('enemies', mockData);
    expect(result).to.be.an('object');
    expect(result).to.have.property('eventKey');
    expect(result).to.have.property('activation');
    expect((result as { eventKey: string }).eventKey).to.equal('enemies');
  });

  it('should call enemies function override when not discovered', () => {
    const mockData = {
      isDiscovered: false,
      lastDiscoveredAt: new Date('2026-01-11'),
    } as never;

    const result = checkOverrides('enemies', mockData);
    expect(result).to.be.an('object');
    expect((result as { eventKey: string }).eventKey).to.equal('enemies.departed');
  });

  it('should call arbitration function override', () => {
    const mockData = {
      enemy: 'Grineer',
      type: 'Defense',
    } as never;

    const result = checkOverrides('arbitration', mockData);
    expect(result).to.be.a('string');
    expect(result).to.equal('arbitration.grineer.defense');
  });

  it('should handle arbitration with no enemy', () => {
    const mockData = {
      enemy: null,
      type: 'Defense',
    } as never;

    const result = checkOverrides('arbitration', mockData);
    expect(result).to.equal('');
  });

  it('should handle arbitration with spaces in type', () => {
    const mockData = {
      enemy: 'Corpus',
      type: 'Mobile Defense',
    } as never;

    const result = checkOverrides('arbitration', mockData);
    expect(result).to.equal('arbitration.corpus.mobiledefense');
  });

  it('should handle fissures with different tiers', () => {
    const mockData1 = {
      tierNum: 1,
      missionType: 'Exterminate',
    } as never;

    const result1 = checkOverrides('fissures', mockData1);
    expect(result1).to.equal('fissures.t1.exterminate');

    const mockData5 = {
      tierNum: 5,
      missionType: 'Survival',
    } as never;

    const result5 = checkOverrides('fissures', mockData5);
    expect(result5).to.equal('fissures.t5.survival');
  });
});
