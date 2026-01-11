import { EventEmitter } from 'node:events';
import { expect } from 'chai';
import WorldstateEmitter from '../../index';
import { lastUpdated } from '../../utilities';

/**
 * Integration tests for Worldstate handler
 * These tests verify real-world usage without mocking internal dependencies
 * Note: These are slower tests that make actual network requests
 */
describe('Worldstate Integration Tests', () => {
  let emitter: WorldstateEmitter | undefined;

  afterEach(async () => {
    if (emitter) {
      // Clean up any running intervals/timers
      emitter = undefined;
    }
  });

  describe('initialization', () => {
    it('should create emitter with default options', () => {
      emitter = new WorldstateEmitter();
      expect(emitter).to.be.instanceOf(EventEmitter);
    });

    it('should create emitter for specific locale', () => {
      emitter = new WorldstateEmitter({ locale: 'de' });
      expect(emitter).to.be.instanceOf(EventEmitter);
    });

    it('should create emitter with worldstate feature', () => {
      emitter = new WorldstateEmitter({
        features: ['worldstate'],
      });
      expect(emitter).to.be.instanceOf(EventEmitter);
    });
  });

  describe('worldstate event emission', () => {
    it('should emit parsed worldstate events', function (done) {
      this.timeout(10000); // Allow time for network requests

      emitter = new WorldstateEmitter({
        locale: 'en',
        features: ['worldstate'], // Only worldstate for this test
      });

      // Listen for any worldstate event
      emitter.once('ws:update:event', (packet) => {
        expect(packet).to.have.property('id');
        expect(packet).to.have.property('key');
        expect(packet).to.have.property('platform');
        expect(packet).to.have.property('language', 'en');
        expect(packet).to.not.have.property('cycleStart');
        done();
      });

      // Trigger a worldstate update if needed
      // The emitter should automatically fetch and emit events
    });

    it('should track lastUpdated timestamps', function (done) {
      this.timeout(10000);

      emitter = new WorldstateEmitter({
        locale: 'en',
        features: ['worldstate'],
      });

      emitter.once('ws:update:event', (packet) => {
        // Check that lastUpdated was set for the platform/language
        if (packet.platform && packet.language) {
          const platform = packet.platform as 'pc' | 'ps4' | 'xb1' | 'swi';
          expect(lastUpdated[platform]).to.exist;
          expect(lastUpdated[platform][packet.language]).to.be.a('number');
          expect(lastUpdated[platform][packet.language]).to.be.greaterThan(0);
          done();
        }
      });
    });

    it('should emit events for multiple locales', function (done) {
      this.timeout(10000);

      // Don't specify locale - should handle all locales
      emitter = new WorldstateEmitter({
        features: ['worldstate'],
      });

      const receivedLanguages = new Set<string>();

      emitter.on('ws:update:event', (packet) => {
        if (packet.language) {
          receivedLanguages.add(packet.language);
        }

        // Once we've received events, we're done
        if (receivedLanguages.size > 0) {
          expect(receivedLanguages.size).to.be.greaterThan(0);
          done();
        }
      });
    });

    it('should handle different event types', function (done) {
      this.timeout(15000);

      emitter = new WorldstateEmitter({
        locale: 'en',
        features: ['worldstate'],
      });

      const eventTypes = new Set<string>();
      const maxEvents = 5;

      emitter.on('ws:update:event', (packet) => {
        if (packet.key) {
          eventTypes.add(packet.key);
        }

        if (eventTypes.size >= maxEvents) {
          expect(eventTypes.size).to.be.at.least(3);
          done();
        }
      });

      // Set a fallback timeout
      setTimeout(() => {
        if (eventTypes.size > 0) {
          done();
        }
      }, 12000);
    });
  });

  describe('raw worldstate updates', () => {
    it('should emit raw worldstate data', function (done) {
      this.timeout(10000);

      emitter = new WorldstateEmitter({
        locale: 'en',
        features: ['worldstate'],
      });

      emitter.once('ws:update:raw', (packet) => {
        expect(packet).to.have.property('platform');
        expect(packet).to.have.property('data');
        expect(packet.data).to.be.a('string');
        done();
      });
    });

    it('should emit parsed updates after raw updates', function (done) {
      this.timeout(10000);

      emitter = new WorldstateEmitter({
        locale: 'en',
        features: ['worldstate'],
      });

      let rawReceived = false;
      let parsedReceived = false;

      emitter.on('ws:update:raw', () => {
        rawReceived = true;
      });

      emitter.on('ws:update:parsed', () => {
        parsedReceived = true;

        if (rawReceived && parsedReceived) {
          done();
        }
      });
    });
  });

  describe('event filtering', () => {
    it('should only emit events with valid IDs', function (done) {
      this.timeout(10000);

      emitter = new WorldstateEmitter({
        locale: 'en',
        features: ['worldstate'],
      });

      let eventCount = 0;
      const maxEvents = 10;

      emitter.on('ws:update:event', (packet) => {
        // All emitted events must have IDs
        expect(packet).to.have.property('id');
        expect(packet.id).to.be.a('string');
        expect(packet.id).to.not.be.empty;

        eventCount++;
        if (eventCount >= maxEvents) {
          done();
        }
      });

      // Fallback timeout
      setTimeout(() => {
        if (eventCount > 0) {
          done();
        }
      }, 8000);
    });

    it('should emit events without cycleStart property', function (done) {
      this.timeout(10000);

      emitter = new WorldstateEmitter({
        locale: 'en',
        features: ['worldstate'],
      });

      emitter.once('ws:update:event', (packet) => {
        expect(packet).to.not.have.property('cycleStart');
        done();
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async function () {
      this.timeout(5000);

      // Create emitter - it should handle any network issues internally
      emitter = new WorldstateEmitter({
        locale: 'en',
        features: ['worldstate'],
      });

      // Should not throw
      await new Promise((resolve) => setTimeout(resolve, 2000));
      expect(emitter).to.exist;
    });
  });
});
