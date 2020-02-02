'use strict';

const Emitter = require('../index.js');

const e = new Emitter({ platform: 'pc', language: 'en' });

e.on('rss', console.log);

console.log(JSON.stringify(e.getRss()));
