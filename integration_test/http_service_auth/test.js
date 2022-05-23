'use strict';

const base64 = require('base-64');
const status = require('http-status');

module.exports = (it, superagent, expect, config) => {

  it('--> should perform an authenticated call', (done) => {
    superagent.post(config.deploy_url)
      .send({ name: 'Functions' })
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Basic ' + base64.encode('admin:welcome'))
      .end((err, res) => {
        console.log('Called authenticated request');

        expect(err).to.be.null;
        expect(res.ok)
          .to
          .equal(true);

        expect(res.text)
          .to
          .equal('Hello Functions!');

        done();
      });
  });

  it('--> should perform an invalid authenticated call', (done) => {
    superagent.post(config.deploy_url)
      .send({ name: 'Functions' })
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Basic ' + base64.encode('admin:notwelcome'))
      .end((err, res) => {
        console.log('Called request with invalid credentials');

        expect(err).to.not.be.null;
        expect(err.status)
          .to
          .equal(status.UNAUTHORIZED);
        expect(res.unauthorized)
          .to
          .equal(true);

        done();
      });
  });
};
