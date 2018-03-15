"use strict";

const status        = require('http-status');

module.exports = (it, superagent, expect, config) => {

    it("--> should perform a call caching headers", (done) => {
        superagent.get(config.deploy_url + '/path1')
            .end((err, res) => {
                console.log("Called path1 GET");

                expect(err).to.be.null;
                expect(res.ok).to.equal(true);
                expect(res.header['cache-control']).to.equal('public,max-age=300');

                expect(res.text).to.equal("PATH1 GET HELLO WORLD");

                done();
            });
    });

};
