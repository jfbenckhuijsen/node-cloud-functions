"use strict";

const CloudFunctions = require('../../lib/index.js')(__dirname + '/config.json', '');

module.exports = CloudFunctions.restServiceModule({
    name: 'http_service_paths',
    cors: false,
    paths : [
        {
            method: "POST",
            path: "/path1",
            auth: false,
            handler: (LOGGER, req, res) => {
                res.send(`PATH1 POST ${req.body.name || 'World'}!`);
            }
        },
        {
            method: "GET",
            path: "/path1",
            auth: false,
            handler: (LOGGER, req, res) => {
                res.send('PATH1 GET World}!');
            }
        },
        {
            method: "POST",
            path: "/path2",
            auth: false,
            handler: (LOGGER, req, res) => {
                res.send(`PATH2 POST ${req.body.name || 'World'}!`);
            }
        },
        {
            method: "POST",
            path: "/parampath/{param}",
            auth: false,
            handler: (LOGGER, req, res) => {
                res.send(`PARAMPATH ${req.params.param || 'World'}!`);
            }
        }
    ]
});
