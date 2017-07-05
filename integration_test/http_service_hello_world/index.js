"use strict";

const CloudFunctions = require('../../lib/index.js')(__dirname + '/config.json', '');

module.exports = CloudFunctions.restServiceModule({
    name: 'http_service_hello_world',
    cors: false,
    paths : [
        {
            method: "POST",
            path: "/",
            auth: false,
            handler: (LOGGER, req, res) => {
                res.send(`Hello ${req.body.name || 'World'}!`);
            }
        }
    ]
});
