const status = require('http-status');

function defaultErrorHandler(err, _req, res, _next) {
  res.status(status.INTERNAL_SERVER_ERROR)
    .send(JSON.stringify(err));
}

module.exports = {
  name: 'Default error',
  priority: 1000,
  handler: (restpath, _pathDef, _options) => {
    restpath.insertMiddleware(defaultErrorHandler, module.exports.priority);
  },
};

module.exports.defaultErrorHandler = defaultErrorHandler;
