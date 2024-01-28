import chai from 'chai';
import WSEmitter from '../../index.js';

chai.should();

const ws = await WSEmitter.make();

describe('access', function () {
  before((done) => {
    setTimeout(() => done(), 10000);
  });
  it('should return data when requested', async () => {
    const data = ws.getWorldstate();
    data.should.be
      .an('object')
      .that.has.all.keys(
        'alerts',
        'arbitration',
        'cambionCycle',
        'cetusCycle',
        'conclaveChallenges',
        'constructionProgress',
        'dailyDeals',
        'darkSectors',
        'earthCycle',
        'events',
        'fissures',
        'flashSales',
        'globalUpgrades',
        'invasions',
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
        'weeklyChallenges',
        'zarimanCycle'
      );
  });
});
