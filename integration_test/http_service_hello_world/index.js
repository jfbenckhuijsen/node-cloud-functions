"use strict";

const CloudFunctions = require('cloud-functions')(__dirname + '/config.json', '');

module.exports = CloudFunctions.restServiceModule({
    name: 'http_service_hello_world',
    enableCors: false,
    paths : [
        {
            method: "POST",
            path: "/",
            auth: false,
            handler: (LOGGER, req, res, responseCallback) => {
                res.send(`Hello ${req.body.name || 'World'}!`);
            }
        }
    ]
});
