'use strict';

const Worldstate = require('warframe-worldstate-parser');

class WSCache {
  constructor({
    platform, language, kuvaCache, sentientCache, eventEmitter,
  }) {
    this.inner = null;
    Object.defineProperty(this, 'inner', { enumerable: false, configurable: false });

    this.kuvaCache = kuvaCache;
    Object.defineProperty(this, 'kuvaCache', { enumerable: false, configurable: false });

    this.sentientCache = sentientCache;
    Object.defineProperty(this, 'sentientCache', { enumerable: false, configurable: false });

    this.platform = platform;
    this.language = language;

    this.emitter = eventEmitter;
  }

  get data() {
    return this.inner;
  }

  set data(newData) {
    const t = new Worldstate(newData, {
      locale: this.language,
      kuvaCache: this.kuvaCache,
      sentientCache: this.sentientCache,
    });
    if (!t.timestamp) return;
    setTimeout(() => {
      this.inner = t;
      this.emitter.emit('ws:update:parsed', { language: this.language, platform: this.platform, data: this.inner });
    }, 1000);
  }

  set twitter(newTwitter) {
    if (!(newTwitter && newTwitter.length)) return;
    this.inner.twitter = newTwitter;
  }
}

module.exports = WSCache;
