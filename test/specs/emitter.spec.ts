import { expect } from 'chai';
import WSEmitter from '../../index';

const ws = await WSEmitter.make();

describe('emitter', function () {
  it('should send tweet data when a tweet happens', (done) => {
    ws.on('tweet', (d: Record<string, unknown>) => {
      expect(d).to.be.an('object').that.has.all.keys('eventKey', 'tweets');
      expect(d.eventKey).to.be.a('string').and.to.equal('twitter.retweet.tobitenno');
      expect(d.tweets).to.be.an('array').with.lengthOf(0);
      done();
    });

    ws.emit('tweet', { eventKey: 'twitter.retweet.tobitenno', tweets: [] });
  });
});
