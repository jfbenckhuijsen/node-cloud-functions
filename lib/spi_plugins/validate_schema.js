const status = require('http-status');

function createValidateMiddleware(schema) {
  // eslint-disable-next-line global-require
  const Joi = require('joi');

  return (req, res, next) => {
    const joiSchema = Joi.object(schema);
    const { error } = joiSchema.validate(req.body);
    if (error) {
      res.status(status.BAD_REQUEST)
        .send(error.details.map((detail) => ({
          message: detail.message,
          path: detail.path,
        })));
    } else {
      next();
    }
  };
}

module.exports = {
  name: 'Validate schema',
  priority: 500,
  handler: (restpath, pathDef, _options) => {
    const { schema } = pathDef;
    if (schema) {
      restpath.insertMiddleware(createValidateMiddleware(schema), module.exports.priority);
    }
  },
};
