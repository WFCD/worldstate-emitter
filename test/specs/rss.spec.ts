import { expect } from 'chai';
import RSS from '../../handlers/RSS';
import {
  mockRSSItem,
  mockRSSItemOldDate,
  mockRSSItemWithDefaultAttach,
  mockRSSItemWithoutImage,
  mockRSSItemWithRelativeImage,
  mockRSSItemWithRssLink,
} from '../fixtures/rss';
import { createMockEmitter, createMockLogger } from '../helpers/mocks';

describe('RSS Handler', () => {
  describe('constructor', () => {
    let rss: RSS | undefined;
    afterEach(() => {
      if (rss) {
        rss.destroy();
        rss = undefined;
      }
    });

    it('should initialize with an event emitter', () => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false });

      expect(rss).to.be.instanceOf(RSS);
      expect(rss.feeder).to.exist;
    });

    it('should add RSS feeds when started', () => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false });

      expect(rss.feeder.list).to.be.an('array');
      expect(rss.feeder.list.length).to.equal(0);

      rss.start();

      expect(rss.feeder.list.length).to.be.greaterThan(0);
    });

    it('should auto-start by default', () => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter);

      expect(rss.feeder.list).to.be.an('array');
      expect(rss.feeder.list.length).to.be.greaterThan(0);
    });

    it('should accept custom feeds', () => {
      const emitter = createMockEmitter();
      const customFeeds = [
        {
          url: 'https://test.com/feed.xml',
          key: 'test',
        },
      ];
      rss = new RSS(emitter, { autoStart: false, feeds: customFeeds });

      rss.start();

      expect(rss.feeder.list.length).to.equal(1);
    });

    it('should accept custom start time', () => {
      const emitter = createMockEmitter();
      const startTime = Date.now() - 10000;
      rss = new RSS(emitter, { autoStart: false, startTime });

      expect(rss).to.be.instanceOf(RSS);
    });
  });

  describe('RSS feed handling', () => {
    let rss: RSS | undefined;

    afterEach(() => {
      if (rss) {
        rss.destroy();
        rss = undefined;
      }
    });

    it('should emit RSS event when new item is received', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data).to.be.an('object');
        expect(data).to.have.property('body');
        expect(data).to.have.property('url');
        expect(data).to.have.property('timestamp');
        expect(data).to.have.property('author');
        expect(data).to.have.property('title');
        expect(data).to.have.property('id');
        done();
      });

      // Simulate RSS item received
      rss.feeder.emit('new-item', mockRSSItem);
    });

    it('should extract image from description', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data).to.have.property('image');
        expect(data.image).to.equal('https://example.com/image.png');
        done();
      });

      rss.feeder.emit('new-item', mockRSSItem);
    });

    it('should handle RSS items without images', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        // Image should either be undefined or a default image
        if (data.image) {
          expect(data.image).to.be.a('string');
        }
        done();
      });

      rss.feeder.emit('new-item', mockRSSItemWithoutImage);
    });

    it('should convert relative image URLs to absolute', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data).to.have.property('image');
        expect(data.image).to.match(/^https:\/\//);
        expect(data.image).to.not.match(/^\/\//);
        done();
      });

      rss.feeder.emit('new-item', mockRSSItemWithRelativeImage);
    });

    it('should strip HTML from description', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data.body).to.be.a('string');
        expect(data.body).to.not.match(/<[^>]+>/);
        done();
      });

      rss.feeder.emit('new-item', mockRSSItem);
    });

    it('should use feed author or provide default', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data.author).to.be.an('object');
        expect(data.author).to.have.property('name');
        expect(data.author).to.have.property('url');
        expect(data.author).to.have.property('icon_url');
        done();
      });

      rss.feeder.emit('new-item', mockRSSItem);
    });

    it('should filter items older than start time', () => {
      const emitter = createMockEmitter();
      const startTime = Date.now() + 10000; // 10 seconds in future
      rss = new RSS(emitter, { autoStart: false, startTime });

      let eventEmitted = false;
      emitter.on('rss', () => {
        eventEmitted = true;
      });

      // Emit an old item
      rss.feeder.emit('new-item', mockRSSItem);

      expect(eventEmitted).to.be.false;
    });
  });

  describe('error handling', () => {
    let rss: RSS | undefined;

    afterEach(() => {
      if (rss) {
        rss.destroy();
        rss = undefined;
      }
    });

    it('should handle errors gracefully', () => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false });

      // Should not throw when emitting invalid item
      expect(() => {
        rss!.feeder.emit('new-item', null);
      }).to.not.throw();
    });

    it('should handle malformed RSS items', () => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false });

      const malformedItem = {
        ...mockRSSItem,
        meta: null,
      };

      expect(() => {
        rss!.feeder.emit('new-item', malformedItem);
      }).to.not.throw();
    });

    it('should handle items with image objects', (done) => {
      const emitter = createMockEmitter();
      const mockLogger = {
        ...createMockLogger(),
        debug: (msg: string) => {
          // Verify debug logging for image objects
          if (msg.startsWith('Image:')) {
            expect(msg).to.include('image-object.png');
          }
        },
      };
      rss = new RSS(emitter, { autoStart: false, startTime: 0, logger: mockLogger as never });

      const itemWithImageObject = {
        ...mockRSSItem,
        image: {
          url: 'https://example.com/image-object.png',
          title: 'Image Title',
        },
      };

      emitter.on('rss', (data) => {
        expect(data).to.have.property('image');
        done();
      });

      rss.feeder.emit('new-item', itemWithImageObject);
    });

    it('should handle items with empty image object', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      const itemWithEmptyImageObject = {
        ...mockRSSItem,
        image: {},
      };

      emitter.on('rss', (data) => {
        expect(data).to.be.an('object');
        done();
      });

      rss.feeder.emit('new-item', itemWithEmptyImageObject);
    });

    it('should skip items from unknown feeds', () => {
      const emitter = createMockEmitter();
      const customFeeds = [
        {
          url: 'https://test.com/feed.xml',
          key: 'test',
        },
      ];
      rss = new RSS(emitter, { autoStart: false, feeds: customFeeds, startTime: 0 });

      let eventEmitted = false;
      emitter.on('rss', () => {
        eventEmitted = true;
      });

      // Emit item with unknown feed URL
      const unknownFeedItem = {
        ...mockRSSItem,
        meta: {
          ...mockRSSItem.meta,
          link: 'https://unknown-feed.com/feed.xml',
        },
      };

      rss.feeder.emit('new-item', unknownFeedItem);

      expect(eventEmitted).to.be.false;
    });
  });

  describe('custom logger', () => {
    let rss: RSS | undefined;

    afterEach(() => {
      if (rss) {
        rss.destroy();
        rss = undefined;
      }
    });

    it('should use custom logger when provided', () => {
      const emitter = createMockEmitter();
      const customLogger = createMockLogger();
      rss = new RSS(emitter, { autoStart: false, logger: customLogger as never });

      expect(rss).to.be.instanceOf(RSS);
    });

    it('should use custom logger for debugging', () => {
      const emitter = createMockEmitter();
      let debugCalled = false;
      const customLogger = {
        ...createMockLogger(),
        debug: () => {
          debugCalled = true;
        },
      };
      rss = new RSS(emitter, { autoStart: false, logger: customLogger as never });

      // Start should trigger debug logging
      rss.start();
      expect(debugCalled).to.be.true;
    });
  });

  describe('image extraction', () => {
    let rss: RSS | undefined;

    afterEach(() => {
      if (rss) {
        rss.destroy();
        rss = undefined;
      }
    });

    it('should use defaultAttach when no image in description', (done) => {
      const emitter = createMockEmitter();
      const customFeeds = [
        {
          url: 'https://forums.warframe.com/forum/3-pc-update-notes.xml',
          key: 'test',
          defaultAttach: 'https://default-image.com/image.png',
        },
      ];
      rss = new RSS(emitter, { autoStart: false, feeds: customFeeds, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data.image).to.equal('https://default-image.com/image.png');
        done();
      });

      rss.feeder.emit('new-item', mockRSSItemWithDefaultAttach);
    });

    it('should handle image URLs starting with //', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data.image).to.equal('https://example.com/relative.png');
        done();
      });

      rss.feeder.emit('new-item', mockRSSItemWithRelativeImage);
    });

    it('should return regular image URLs as-is', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data.image).to.equal('https://example.com/image.png');
        done();
      });

      rss.feeder.emit('new-item', mockRSSItem);
    });
  });

  describe('feed finding strategies', () => {
    let rss: RSS | undefined;

    afterEach(() => {
      if (rss) {
        rss.destroy();
        rss = undefined;
      }
    });

    it('should find feed by exact meta.link match', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data).to.have.property('id');
        done();
      });

      rss.feeder.emit('new-item', mockRSSItem);
    });

    it('should find feed by rss:link match', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data).to.have.property('id');
        done();
      });

      rss.feeder.emit('new-item', mockRSSItemWithRssLink);
    });

    it('should use feeder.list as fallback for feed matching', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      // Start feeds to populate feeder.list
      rss.start();

      emitter.on('rss', (data) => {
        expect(data).to.be.an('object');
        done();
      });

      // Emit with a registered feed
      setTimeout(() => {
        rss!.feeder.emit('new-item', mockRSSItem);
      }, 100);
    });

    it('should log debug message when no feed is found', () => {
      const emitter = createMockEmitter();
      let debugCalled = false;
      const mockLogger = {
        ...createMockLogger(),
        debug: (msg: string) => {
          if (msg.includes('No feed found for item')) {
            debugCalled = true;
          }
        },
      };
      const customFeeds = [
        {
          url: 'https://different-feed.com/feed.xml',
          key: 'test',
        },
      ];
      rss = new RSS(emitter, {
        autoStart: false,
        feeds: customFeeds,
        startTime: 0,
        logger: mockLogger as never,
      });

      let eventEmitted = false;
      emitter.on('rss', () => {
        eventEmitted = true;
      });

      // Emit item with unknown feed URL
      const unknownFeedItem = {
        ...mockRSSItem,
        meta: {
          ...mockRSSItem.meta,
          link: 'https://completely-unknown-feed.com/feed.xml',
        },
      };

      rss.feeder.emit('new-item', unknownFeedItem);

      expect(eventEmitted).to.be.false;
      expect(debugCalled).to.be.true;
    });
  });

  describe('RSS item fields', () => {
    let rss: RSS | undefined;

    afterEach(() => {
      if (rss) {
        rss.destroy();
        rss = undefined;
      }
    });

    it('should include url and timestamp fields', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data).to.have.property('url');
        expect(data.url).to.equal(mockRSSItem.link);
        expect(data).to.have.property('timestamp');
        expect(data.timestamp).to.be.instanceOf(Date);
        done();
      });

      rss.feeder.emit('new-item', mockRSSItem);
    });

    it('should include description from meta', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data).to.have.property('description');
        expect(data.description).to.equal(mockRSSItem.meta.description);
        done();
      });

      rss.feeder.emit('new-item', mockRSSItem);
    });

    it('should use default author when feed has no author', (done) => {
      const emitter = createMockEmitter();
      const customFeeds = [
        {
          url: 'https://forums.warframe.com/forum/3-pc-update-notes.xml',
          key: 'test',
          // No author field
        },
      ];
      rss = new RSS(emitter, { autoStart: false, feeds: customFeeds, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data.author.name).to.equal('Warframe Forums');
        expect(data.author).to.have.property('url');
        expect(data.author).to.have.property('icon_url');
        done();
      });

      rss.feeder.emit('new-item', mockRSSItem);
    });

    it('should use feed author when provided', (done) => {
      const emitter = createMockEmitter();
      const customFeeds = [
        {
          url: 'https://forums.warframe.com/forum/3-pc-update-notes.xml',
          key: 'test',
          author: {
            name: 'Custom Author',
            url: 'https://custom.com',
            icon_url: 'https://custom.com/icon.png',
          },
        },
      ];
      rss = new RSS(emitter, { autoStart: false, feeds: customFeeds, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data.author.name).to.equal('Custom Author');
        expect(data.author.url).to.equal('https://custom.com');
        expect(data.author.icon_url).to.equal('https://custom.com/icon.png');
        done();
      });

      rss.feeder.emit('new-item', mockRSSItem);
    });

    it('should include image in spread when image exists', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      emitter.on('rss', (data) => {
        expect(data).to.have.property('image');
        expect(data.image).to.be.a('string');
        done();
      });

      rss.feeder.emit('new-item', mockRSSItem);
    });
  });

  describe('error handling edge cases', () => {
    let rss: RSS | undefined;

    afterEach(() => {
      if (rss) {
        rss.destroy();
        rss = undefined;
      }
    });

    it('should catch and log errors during item processing', () => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      // Create an item that will cause an error during processing
      const malformedItem = {
        ...mockRSSItem,
        description: null, // This will cause sanitizeHtml to potentially error
        meta: {
          ...mockRSSItem.meta,
          description: undefined,
        },
      };

      expect(() => {
        rss!.feeder.emit('new-item', malformedItem);
      }).to.not.throw();
    });

    it('should handle items with undefined description', (done) => {
      const emitter = createMockEmitter();
      rss = new RSS(emitter, { autoStart: false, startTime: 0 });

      const itemWithNoDescription = {
        ...mockRSSItem,
        description: undefined,
      };

      emitter.on('rss', (data) => {
        expect(data.body).to.be.a('string');
        done();
      });

      rss.feeder.emit('new-item', itemWithNoDescription);
    });

    it('should catch errors when processing fails', () => {
      const emitter = createMockEmitter();
      let errorLogged = false;
      const mockLogger = {
        ...createMockLogger(),
        error: (err: unknown) => {
          errorLogged = true;
          expect(err).to.exist;
        },
      };
      rss = new RSS(emitter, { autoStart: false, startTime: 0, logger: mockLogger as never });

      // Create an item that will throw during processing
      const badItem = {
        ...mockRSSItem,
        // Make pubDate throw when accessed
        get pubDate(): Date {
          throw new Error('Test error');
        },
      };

      expect(() => {
        rss!.feeder.emit('new-item', badItem);
      }).to.not.throw();

      expect(errorLogged).to.be.true;
    });
  });
});
