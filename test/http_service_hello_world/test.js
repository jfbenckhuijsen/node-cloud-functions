module.exports = (it, expect, config) => {
  it('--> should perform a basic hello world call', (done) => {
    config.superagent.post(config.deploy_url)
      .send({ name: 'Functions' })
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        console.log('Called hello world');

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
};
