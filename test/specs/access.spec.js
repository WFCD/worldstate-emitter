import { expect } from 'chai';
import WSEmitter from 'worldstate-emitter';

const ws = await WSEmitter.make();

describe('access', () => {
  before((done) => {
    setTimeout(() => done(), 60000); // wait up to 10 minutes for initial data fetch
  });
  it('should return data when requested', function async() {
    if (process.env.LINT_STAGED === 'true') {
      this.skip();
    }

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
