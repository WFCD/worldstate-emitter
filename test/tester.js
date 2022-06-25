'use strict';

const Emitter = require('../index');

const e = new Emitter();

e.on('rss', console.log);

const wsEvents = ['news'];
const locale = 'en';
const pl = 'pc';

e.on('ws:update:event', ({ id, language, platform, key, data }) => {
  if (wsEvents.includes(key) && language === locale && platform === pl) {
    console.log(`${id}:${language}:${platform}:${key}`);
    console.log(data[key]);
  }
});
