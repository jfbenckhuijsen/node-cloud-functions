"use strict";

const CloudFunctions = require('cloud-functions')(__dirname + '/config.json', '');

module.exports = CloudFunctions.restServiceModule({
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
