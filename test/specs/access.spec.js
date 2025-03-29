import { expect } from 'chai';
import WSEmitter from 'worldstate-emitter';

const ws = await WSEmitter.make();

describe('access', () => {
  before((done) => {
    setTimeout(() => done(), 10000);
  });
  it('should return data when requested', async () => {
    const data = ws.getWorldstate();

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
  });
});
