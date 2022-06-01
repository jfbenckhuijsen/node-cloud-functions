module.exports = (it, expect, config) => {
  it('--> should perform a call to paths which differ by method', (done) => {
    config.superagent.post(`${config.deploy_url}/path1`)
      .send({ name: 'Functions' })
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        console.log('Called path1 POST');

        expect(err).to.be.null;
        expect(res.ok)
          .to
          .equal(true);

        expect(res.text)
          .to
          .equal('PATH1 POST Functions!');

        done();
      });
  });

  it('--> should perform a call to paths which differ by path', (done) => {
    config.superagent.post(`${config.deploy_url}/path2`)
      .send({ name: 'Functions' })
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        console.log('Called path2');

        expect(err).to.be.null;
        expect(res.ok)
          .to
          .equal(true);

        expect(res.text)
          .to
          .equal('PATH2 POST Functions!');

        done();
      });
  });

  it('--> should perform a call to paths which has a parameter', (done) => {
    config.superagent.post(`${config.deploy_url}/parampath/Functions`)
      .send({ name: 'Functions' })
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        console.log('Called parampath');

        expect(err).to.be.null;
        expect(res.ok)
          .to
          .equal(true);

        expect(res.text)
          .to
          .equal('PARAMPATH Functions!');

        done();
      });
  });
};
