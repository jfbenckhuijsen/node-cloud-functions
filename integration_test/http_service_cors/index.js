'use strict';

const CloudServant = require('cloud-servant')(__dirname + '/config.json', '');

module.exports = CloudServant.restServiceModule({
  name: 'http-service-cors',
  cors: true,
  paths: [
    {
      method: 'POST',
      path: '/',
      handler: (_LOGGER, req, res) => {
        res.send(`Hello ${req.body.name || 'World'}!`);
      }
    },
    {
      method: 'GET',
      path: '/',
      handler: (_LOGGER, _req, res) => {
        res.send(`Hello World!`);
      }
    }

  ]
});
