import { expect } from 'chai';
import WSEmitter from 'worldstate-emitter';

const ws = await WSEmitter.make({
  locale: 'en',
  features: ['worldstate'],
});

describe('access', () => {
  it('should return data when requested', (done) => {
    const interval = setInterval(() => {
      const data = ws.getWorldstate();
      if (data && Object.keys(data).length > 0) {
        expect(data)
          .to.be.an('object')
          .that.includes.all.keys(
            'alerts',
            'arbitration',
            'archonHunt',
            'calendar',
            'cambionCycle',
            'cetusCycle',
            'conclaveChallenges',
            'constructionProgress',
            'dailyDeals',
            'darkSectors',
            'duviriCycle',
            'earthCycle',
            'events',
            'fissures',
            'flashSales',
            'globalUpgrades',
            'invasions',
            'kinepage',
            'kuva',
            'news',
            'nightwave',
            'persistentEnemies',
            'sentientOutposts',
            'simaris',
            'sortie',
            'steelPath',
            'syndicateMissions',
            'timestamp',
            'vallisCycle',
            'vaultTrader',
            'voidTrader',
            'voidTraders',
            'weeklyChallenges',
            'zarimanCycle'
          );

        const some = data.syndicateMissions.some((mission) => mission.jobs.some((job) => expect(job).to.not.be.empty));
        expect(some).to.be.true;

        done();
        clearInterval(interval);
      }
    }, 1000);

    setTimeout(() => expect(false).to.eq(true, 'No data found after 2 minutes of attempts'), 240000);
  });
});
