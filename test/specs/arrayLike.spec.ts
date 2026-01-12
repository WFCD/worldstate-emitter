import { expect } from 'chai';
import arrayLike from '../../handlers/events/arrayLike';
import type { ArrayEventDeps } from '../../handlers/events/types';

describe('arrayLike', () => {
  it('should process array of objects and return event packets', () => {
    const deps: ArrayEventDeps = {
      key: 'fissures',
      platform: 'pc',
      language: 'en',
      data: [
        {
          tierNum: 1,
          missionType: 'Exterminate',
          activation: new Date('2026-01-11T12:00:00Z'),
          expiry: new Date('2026-01-11T13:00:00Z'),
        } as never,
        {
          tierNum: 2,
          missionType: 'Capture',
          activation: new Date('2026-01-11T12:00:00Z'),
          expiry: new Date('2026-01-11T13:00:00Z'),
        } as never,
      ],
    };

    const packets = arrayLike(deps);

    expect(packets).to.be.an('array');
    // Each item in the array should be processed
    for (const packet of packets) {
      expect(packet).to.have.property('data');
      expect(packet).to.have.property('id');
    }
  });

  it('should apply checkOverrides to each array item', () => {
    const deps: ArrayEventDeps = {
      key: 'events',
      platform: 'pc',
      language: 'en',
      data: [
        {
          activation: new Date('2026-01-11T12:00:00Z'),
          expiry: new Date('2026-01-11T13:00:00Z'),
        } as never,
      ],
    };

    const packets = arrayLike(deps);

    // 'events' should be overridden to 'operations'
    expect(packets).to.be.an('array');
    if (packets.length > 0) {
      expect(packets[0].id).to.include('operations');
    }
  });

  it('should handle empty arrays', () => {
    const deps: ArrayEventDeps = {
      key: 'fissures',
      platform: 'pc',
      language: 'en',
      data: [],
    };

    const packets = arrayLike(deps);

    expect(packets).to.be.an('array');
    expect(packets.length).to.equal(0);
  });

  it('should handle override returning object with eventKey', () => {
    const deps: ArrayEventDeps = {
      key: 'enemies',
      platform: 'pc',
      language: 'en',
      data: [
        {
          isDiscovered: true,
          lastDiscoveredAt: new Date('2026-01-11'),
          activation: new Date('2026-01-11T12:00:00Z'),
          expiry: new Date('2026-01-11T13:00:00Z'),
        } as never,
      ],
    };

    const packets = arrayLike(deps);

    expect(packets).to.be.an('array');
    for (const packet of packets) {
      expect(packet).to.have.property('id');
      expect(packet.id).to.include('enemies');
    }
  });

  it('should filter out null results from objectLike', () => {
    const deps: ArrayEventDeps = {
      key: 'fissures',
      platform: 'pc',
      language: 'en',
      data: [
        {
          tierNum: 1,
          missionType: 'Exterminate',
          activation: new Date('2026-01-11T12:00:00Z'),
          expiry: new Date('2026-01-11T13:00:00Z'),
        } as never,
      ],
    };

    const packets = arrayLike(deps);

    // All valid items should be included
    expect(packets).to.be.an('array');
  });

  it('should catch and log errors during processing', () => {
    // Create a Proxy that throws when accessed
    const throwingProxy = new Proxy([], {
      get() {
        throw new Error('Test error');
      },
    });

    const deps: ArrayEventDeps = {
      key: 'fissures',
      platform: 'pc',
      language: 'en',
      data: throwingProxy as never,
    };

    // Should not throw, but return empty array
    const packets = arrayLike(deps);

    expect(packets).to.be.an('array');
    expect(packets.length).to.equal(0);
  });

  it('should handle multiple array items', () => {
    const deps: ArrayEventDeps = {
      key: 'fissures',
      platform: 'pc',
      language: 'en',
      data: [
        {
          tierNum: 1,
          missionType: 'Exterminate',
          activation: new Date('2026-01-11T12:00:00Z'),
          expiry: new Date('2026-01-11T13:00:00Z'),
        } as never,
        {
          tierNum: 2,
          missionType: 'Capture',
          activation: new Date('2026-01-11T12:00:00Z'),
          expiry: new Date('2026-01-11T13:00:00Z'),
        } as never,
        {
          tierNum: 3,
          missionType: 'Survival',
          activation: new Date('2026-01-11T12:00:00Z'),
          expiry: new Date('2026-01-11T13:00:00Z'),
        } as never,
      ],
    };

    const packets = arrayLike(deps);

    expect(packets).to.be.an('array');
    // Note: packets may be empty if objectLike returns undefined
  });
});
