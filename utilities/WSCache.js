'use strict';

const Worldstate = require('warframe-worldstate-parser');
const EventEmitter = require('events');

// const { logger } = require('../utilities');

class WSCache extends EventEmitter {
  constructor(platform, language, kuvaCache) {
    super();
    this.inner = null;
    Object.defineProperty(this, 'inner', { enumerable: false, configurable: false });

    this.kuvaCache = kuvaCache;
    Object.defineProperty(this, 'kuvaCache', { enumerable: false, configurable: false });

    this.platform = platform;
    this.language = language;
  }

  get data() {
    return this.inner;
  }

  set data(newData) {
    const t = new Worldstate(newData, { locale: this.language, kuvaCache: this.kuvaCache });
    if (!t.timestamp) return;
    this.inner = t;
    this.emit('update', this.inner);
  }

  set twitter(newTwitter) {
    if (!(newTwitter && newTwitter.length)) return;
    this.inner.twitter = newTwitter;
  }
}

module.exports = WSCache;
