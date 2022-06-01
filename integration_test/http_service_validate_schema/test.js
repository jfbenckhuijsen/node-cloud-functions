const status = require('http-status');

module.exports = (it, expect, config) => {
  it('--> should perform a call with valid body content', (done) => {
    config.superagent.post(`${config.deploy_url}/path1`)
      .send({ userName: 'a@b.com' })
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        console.log('Called path1 POST');

        expect(err).to.be.null;
        expect(res.ok)
          .to
          .equal(true);

        expect(res.text)
          .to
          .equal('PATH1 POST a@b.com!');

        done();
      });
  });

  it('--> should perform return BAD_REQUEST in case of invalid body content', (done) => {
    config.superagent.post(`${config.deploy_url}/path1`)
      .send({ userName: 'some invalid email' })
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        console.log('Called path1 POST');

        expect(res.status)
          .to
          .equal(status.BAD_REQUEST);

        done();
      });
  });
};
