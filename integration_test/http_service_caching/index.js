"use strict";

const CloudServant = require('cloud-servant')(__dirname + '/config.json', '');

module.exports = CloudServant.restServiceModule({
    name: 'http-service-caching',
    paths : [
        {
            method: "GET",
            path: "/path1",
            cacheHeaders: {
                cacheable: {
                    maxAge: "5min",
                    sharedCaches: true
                }
            },
            handler: (LOGGER, req, res) => {
                res.send('PATH1 GET HELLO WORLD');
            }
        }
    ]
});
