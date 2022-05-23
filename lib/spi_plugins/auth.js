function findAuthorization(auth, options) {
  if (typeof auth === 'string') {
    return options.authStrategies[auth];
  }
  return options.authStrategies.default;
}

module.exports = {
  name: 'Authorization',
  priority: 200,
  handler: (restpath, pathDef, options) => {
    if (pathDef.auth || (options.auth !== undefined && options.auth !== false)) {
      const Passport = require('passport');

      const middleware = findAuthorization(pathDef.auth ? pathDef.auth : options.auth, options);
      if (!middleware) {
        throw new Error(`Invalid configuration: unknown authorization strategy specified or no default strategy:${pathDef.path}`);
      }
      restpath.prependMiddleware(Passport.initialize());
      restpath.insertMiddleware(middleware, module.exports.priority);
    }
  },
};
