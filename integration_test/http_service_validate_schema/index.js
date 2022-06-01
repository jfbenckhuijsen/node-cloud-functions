const CloudServant = require('cloud-servant')(`${__dirname}/config.json`, '');

const { Joi } = CloudServant;

module.exports = CloudServant.restServiceModule({
  name: 'http-service-validate-schema',
  paths: [
    {
      method: 'POST',
      path: '/path1',
      schema: {
        userName: Joi.string()
          .email()
          .required(),
      },
      handler: (_LOGGER, req, res) => {
        res.send(`PATH1 POST ${req.body.userName || 'World'}!`);
      },
    },
  ],
});
