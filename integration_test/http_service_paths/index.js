"use strict";

const CloudServant = require('cloud-servant')(__dirname + '/config.json', '');

module.exports = CloudServant.restServiceModule({
    name: 'http-service-paths',
    paths : [
        {
            method: "POST",
            path: "/path1",
            handler: (LOGGER, req, res) => {
                res.send(`PATH1 POST ${req.body.name || 'World'}!`);
            }
        },
        {
            method: "GET",
            path: "/path1",
            handler: (LOGGER, req, res) => {
                res.send('PATH1 GET World}!');
            }
        },
        {
            method: "POST",
            path: "/path2",
            handler: (LOGGER, req, res) => {
                res.send(`PATH2 POST ${req.body.name || 'World'}!`);
            }
        },
        {
            method: "POST",
            path: "/parampath/{param}",
            handler: (LOGGER, req, res) => {
                console.log("Parampath");
                res.send(`PARAMPATH ${req.params.param || 'World'}!`);
            }
        }
    ]
});
