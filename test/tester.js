'use strict';

const Emitter = require('../index.js');

const e = new Emitter({ platform: 'pc', language: 'en' });

e.on('rss', console.log);

const wsEvents = ['kuva', 'arbitration', 'fissures'];

e.on('ws:update:event', ({ id, language, platform, key, data }) => {
  if (wsEvents.includes(key)) {
    console.log(`${id}:${language}:${platform}:${key}`);
  }
});