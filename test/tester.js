import Emitter from '../index.js';
import Cache from '../utilities/Cache.js';
import { worldstateUrl } from '../resources/config.js';

const e = await Emitter.make({ locale: 'en' });
setTimeout(async () => {
  console.error(typeof e.getWorldstate());
}, 7000);
e.on('rss', console.log);
e.on('ws:update:raw', console.log);

e.on('ws:update:parsed', ({ language, platform, data }) => {
  // if (wsEvents.includes(key) && language === locale && platform === pl) {
  console.log(`${language}:${platform}`);
  console.log(Object.keys(data));
});

const cache = await Cache.make(worldstateUrl, '0 * * * * *');
cache.on('update', (data) => console.error(typeof data));
console.error(typeof (await cache.get()));
