"use strict";

function findAuthorization(auth, options) {
    if (typeof auth === 'string') {
        return options.authStrategies[auth];
    } else {
        return options.authStrategies.default;
    }
}

module.exports =  {
    name: "Authorization",
    priority: 200,
    handler: (restpath, pathDef, options) => {
        if (pathDef.auth || (options.auth !== undefined && options.auth != false)) {
            const Passport = require('passport');

            let middleware = findAuthorization(pathDef.auth ? pathDef.auth : options.auth, options);
            if (!middleware) {
                throw new Error("Invalid configuration: unknown authorization startegy specified or no default strategy:" + pathDef.path);
            }
            restpath.prependMiddleware(Passport.initialize());
            restpath.insertMiddleware(middleware, this.priority);
        }
    }
};
