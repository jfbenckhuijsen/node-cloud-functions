"use strict";

const CloudServant = require('cloud-servant')(__dirname + '/config.json', '');

module.exports = CloudServant.restServiceModule({
    name: 'http-service-hello-world',
    paths : [
        {
            method: "POST",
            path: "/",
            handler: (LOGGER, req, res) => {
                res.send(`Hello ${req.body.name || 'World'}!`);
            }
        }
    ]
});
