'use strict';

const chai = require('chai');

chai.should();

const WSEmitter = require('../..');

const ws = new WSEmitter();

describe('emitter', function () {
  it('should send tweet data when a tweet happens', (done) => {
    ws.on('tweet', (d) => {
      d.should.be.an('object').that.has.all.keys('eventKey', 'tweets');
      d.eventKey.should.be.a('string').and.to.equal('twitter.retweet.tobitenno');
      d.tweets.should.be.an('array').with.lengthOf(0);
      done();
    });

    ws.emit('tweet', { eventKey: 'twitter.retweet.tobitenno', tweets: [] });
  });
});
