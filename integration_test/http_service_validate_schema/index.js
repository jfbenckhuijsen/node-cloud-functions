"use strict";

const CloudServant = require('cloud-servant')(__dirname + '/config.json', '');

module.exports = CloudServant.restServiceModule({
    name: 'http-service-validate-schema',
    paths : [
        {
            method: "POST",
            path: "/path1",
            schema: {
                userName : Joi.string().email().required(),
            },
            handler: (LOGGER, req, res) => {
                res.send(`PATH1 POST ${req.body.userName || 'World'}!`);
            }
        }
    ]
});
