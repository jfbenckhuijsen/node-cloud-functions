"use strict";

const CloudFunctions = require('../../lib/index.js')(__dirname + '/config.json', '');

module.exports = CloudFunctions.restServiceModule({
    name: 'http_service_hello_cors_world',
    cors: true,
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
