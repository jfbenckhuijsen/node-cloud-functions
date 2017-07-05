"use strict";

let Passport = require('passport');

/**
 *
 * @param options JSON object with structure: {
 *  paths: The path definitions and handlers/controllers to call. Array where each object has a structure: [
 *      {
        method: [String, HTTP Verb of the method],
        path: [Path of the rest service, may contain parameters enclosed in curly braces],
        use: [Array of Connect middleware methods, overrides the middleware defined in options for this path],
        requestHandler: [Function called when this path is matched],

        auth: [Whether authentication is needed. Can be either a name or boolean. The name refers to the authentication
               strategy. A boolean true indicates to use the default strategy.],
        cors: [Override global enabling of CORS on a per path basis]
        }
 *  ],
 *  use: [Array of Connect middleware methods],
 *  cors: whether to also send preflight responses for CORS requests for each of the paths.
 *  authStrategies: The definition of authentication handlers based on Passport: {
 *      "name" : [middleware function]. Name identifies the name of the startegy to use in path auth declarations. In
 *               the special name "default" is choosen as name, this is considered the default strategy.
 *  }
 *  auth: true/false to globally enable authentication.
 *
 * }
 * @constructor
 */
let PathController = function(options) {

    function findAuthorization(auth) {
        if (typeof auth == 'string') {
            return options.authStrategies[auth];
        } else {
            return options.authStrategies.default;
        }
    }

    const PATH_PARAM_REGEXP = "([^\\/]+)";

    const cors = require('cors');

    this.compiledPaths = options.paths.map((pathDef) => {
        let result = {
            params: [],
            definition: {
                method: Array.isArray(pathDef.method) ? pathDef.method : [pathDef.method],
                path: pathDef.path,
                requestHandler: pathDef.requestHandler,
                cors: pathDef.cors,

                use : [].concat(options.use || []).concat(pathDef.use || []).concat(PathController.prototype.defaultErrorHandler),
                schema: pathDef.schema
            }
        };

        let paramTokenIndex;
        let path = pathDef.path.replace(/\//g, '\\/');
        while ((paramTokenIndex = path.indexOf("{")) != -1) {
            let endIndex = path.indexOf("}", paramTokenIndex);
            let param = path.substring(paramTokenIndex + 1, endIndex);

            result.params.push(param);

            path = path.replace("{" + param + "}", PATH_PARAM_REGEXP);
        }

        result.pathRegexp = '^' + path + '$';

        if (pathDef.cors || (options.cors !== undefined && options.cors != false)) {
            result.definition.use = result.definition.use.concat([cors()]);/* TODO: Add supprt for CORS options */
            result.definition.method = result.definition.method.concat('OPTIONS');
        }

        if (pathDef.auth || (options.auth !== undefined && options.auth != false)) {
            let middleware = findAuthorization(pathDef.auth ? pathDef.auth : options.auth);
            if (!middleware) {
                throw new Error("Invalid configuration: unknown authorization startegy specified or no default strategy:" + pathDef.path);
            }
            result.definition.use = [Passport.initialize()].concat(result.definition.use.concat(middleware));
        }

        return result;
    });

    if (options.debug) {
        this.compiledPaths.push({
            params: [],
            pathRegexp : '^/_paths$',
            definition: {
                method: ['GET'],
                path: '/_paths',
                use: [],
                requestHandler: (req, res) => {
                    res.send(JSON.stringify(this.compiledPaths.map((path) => {
                        return {
                            method: path.definition.method,
                            path: path.definition.path,
                            pathRegexp: path.pathRegexp
                        }
                    })));
                }
            }
        });
    }
};

PathController.prototype.toApiRequest = function(req) {
    let pathToFind = req.path;
    if (pathToFind == null || pathToFind == '') {
        pathToFind = '/';
    }

    let apiRequests = this.compiledPaths.map((compiledPath) => {
        let regExp = new RegExp(compiledPath.pathRegexp, "g");
        let match = regExp.exec(pathToFind);

        let matches_method = compiledPath.definition.method.indexOf(req.method) != -1;

        /*
         *  Support for CORS, in case CORS is enabled on multiple identical paths, with different methods, this algorithm
         *  will find multiple apiRequests. We're selecting the one with the correct "Access-Control-Request-Method" header.
         */
        let matches_cors_method = !compiledPath.definition.cors || req.method != "OPTIONS" ||
            compiledPath.definition.method.indexOf(req.headers["access-control-request-method"]) != -1;

        if (match && matches_method && matches_cors_method) {
            let apiRequest = {
                params : {},
                api: compiledPath.definition
            };

            for (let i = 0 ; i < match.length - 1; i++) {
                apiRequest.params[compiledPath.params[i]] = match[i + 1];
            }

            return apiRequest;
        } else {
            return null;
        }
    }).filter((apiRequest) => {
        return apiRequest != null;
    });

    if (apiRequests.length > 1) {
        apiRequests = apiRequests.filter((apiRequest) => {
            return apiRequest.api.path === pathToFind;
        });

        if (apiRequests.length != 1) {
            // No exact match found
            throw new Error("Invalid path configuration, not unique path");
        }
    }

    return apiRequests.length ? apiRequests[0] : null;
};

function nextHandler(apiRequest, req, res) {
    req._middlewareIter = 0;

    let next = (err) => {

        function findMiddleware(req, requiredArity) {
            let middleware = null;
            while (req._middlewareIter < apiRequest.api.use.length) {
                let tmp = apiRequest.api.use[req._middlewareIter];
                req._middlewareIter++;
                if (tmp.length == requiredArity) {
                    middleware = tmp;
                    break;
                }
            }
            return middleware;
        }

        if (err) {
            console.log("Middleware iter =" + req._middlewareIter);
            let middleware = findMiddleware(req, 4);
            if (!middleware) {
                console.log("ERROR: Can't find error middleware:" + JSON.stringify(apiRequest.api.use));
            }
            middleware(err, req, res, next);
        } else {
            let middleware = findMiddleware(req, 3);
            if (middleware) {
                middleware(req, res, next);
            } else {
                apiRequest.api.requestHandler(req, res);
            }
        }
    };

    return next;
}

PathController.prototype.executeRequest = function(req, res) {
    console.log("Received request, finding API request");

    let apiRequest = this.toApiRequest(req);
    if (apiRequest) {
        req.params = apiRequest.params;

        let next = nextHandler(apiRequest, req, res);
        next();
    } else {
        res.status(404).send();
    }
};

PathController.prototype.defaultErrorHandler = (err, req, res, next) => {
    res.status(500);
    res.send(JSON.stringify(err));
};


module.exports = PathController;
