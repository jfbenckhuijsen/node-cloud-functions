"use strict";

const CloudServant = require('cloud-servant')(__dirname + '/config.json', '');

module.exports = CloudServant.restServiceModule({
    name: 'http-service-cors',
    cors: true,
    paths : [
        {
            method: "POST",
            path: "/",
            handler: (LOGGER, req, res) => {
                res.send(`Hello ${req.body.name || 'World'}!`);
            }
        },
        {
            method: "GET",
            path: "/",
            handler: (LOGGER, req, res) => {
                res.send(`Hello World!`);
            }
        }

    ]
});
