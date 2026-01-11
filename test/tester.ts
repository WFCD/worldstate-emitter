import type WorldState from 'warframe-worldstate-parser';
import Emitter from '../index';
import { worldstateUrl } from '../resources/config';
import Cache from '../utilities/Cache';

const e = await Emitter.make({ locale: 'en' });
setTimeout(async () => {
  console.error(typeof e.getWorldstate());
}, 7000);
e.on('rss', console.log);
e.on('ws:update:raw', console.log);

e.on('ws:update:parsed', ({ language, platform, data }: { language: string; platform: string; data: WorldState }) => {
  // if (wsEvents.includes(key) && language === locale && platform === pl) {
  console.log(`${language}:${platform}`);
  console.log(Object.keys(data));
});

const cache = await Cache.make(worldstateUrl, '0 * * * * *');
cache.on('update', (data: string) => console.error(typeof data));
console.error(typeof (await cache.get()));
