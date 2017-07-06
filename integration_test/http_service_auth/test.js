"use strict";

const base64        = require('base-64');

module.exports = (it, superagent, expect, config) => {

    it("--> should perform an authenticated call", (done) => {
        superagent.post(config.deploy_url)
            .send({ name: 'Functions'})
            .set('Content-Type', 'application/json')
            .set('Authorization', base64.encode("admin:welcome"))
            .end((err, res) => {
                console.log("Called authenticated request");

                expect(err).to.be.null;
                expect(res.ok).to.equal(true);

                expect(res.text).to.equal("Hello Functions!");

                done();
            });
    });

    it("--> should perform an invalid authenticated call", (done) => {
        superagent.post(config.deploy_url)
            .send({ name: 'Functions'})
            .set('Content-Type', 'application/json')
            .set('Authorization', base64.encode("admin:notwelcome"))
            .end((err, res) => {
                console.log("Called request with invalid credentials");

                expect(err).to.be.null;
                expect(res.unauthorized).to.equal(true);

                done();
            });
    });
};
