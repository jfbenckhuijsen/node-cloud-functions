const base64 = require('base-64');

module.exports = (it, expect, config) => {
  it('--> should perform an authenticated call', (done) => {
    config.superagent.post(config.deploy_url)
      .send({ name: 'Functions' })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Basic ${base64.encode('admin:welcome')}`)
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
    config.superagent.post(config.deploy_url)
      .send({ name: 'Functions' })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Basic ${base64.encode('admin:notwelcome')}`)
      .end((_err, res) => {
        console.log('Called request with invalid credentials');

        expect(res.unauthorized)
          .to
          .equal(true);

        done();
      });
  });
};
