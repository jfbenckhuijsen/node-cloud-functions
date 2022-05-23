'use strict';

module.exports = (it, superagent, expect, config) => {

  it('--> should perform a CORS call', (done) => {
    superagent.options(config.deploy_url)
      .set('Origin', 'http://www.example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, OTHER_HEADER')
      .end((err, res) => {
        console.log('Called CORS preflight request');

        expect(err).to.be.null;
        expect(res.ok)
          .to
          .equal(true);
        expect(res.header['access-control-allow-origin'])
          .to
          .equal('*');
        expect(res.header['access-control-allow-methods'])
          .to
          .have
          .string('POST');
        expect(res.header['access-control-allow-headers'])
          .to
          .equal('Content-Type, OTHER_HEADER');

        superagent.post(config.deploy_url)
          .send({ name: 'Functions' })
          .set('Origin', 'http://www.example.com')
          .set('Content-Type', 'application/json')
          .set('Access-Control-Request-Method', 'POST')
          .set('Access-Control-Request-Headers', 'Content-Type, OTHER_HEADER')
          .set('OTHER_HEADER', 'SomeValue')
          .end((err, res) => {
            console.log('Called CORS POST request');

            expect(err).to.be.null;
            expect(res.ok)
              .to
              .equal(true);

            expect(res.header['access-control-allow-origin'])
              .to
              .equal('*');
            expect(res.text)
              .to
              .equal('Hello Functions!');

            done();
          });
      });
  });

};
