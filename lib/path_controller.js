/*
 ISC License

 Copyright (c) 2017 Jeroen Benckhuijsen

 Permission to use, copy, modify, and/or distribute this software for any
 purpose with or without fee is hereby granted, provided that the above
 copyright notice and this permission notice appear in all copies.

 THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 PERFORMANCE OF THIS SOFTWARE.
 */

"use strict";

const status = require('http-status');

let SPI_PLUGINS = [
    require("./spi_plugins/auth.js"),
    require("./spi_plugins/cors.js"),
    require("./spi_plugins/caching.js"),
    require("./spi_plugins/validate_schema.js"),
    require("./spi_plugins/default_errror.js"),
].sort((a,b) => {
    return a.priority < b.priority ? -1 : a.priority === b.priority ? 0 : 1;
});

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
let PathController = function(options, DEBUG) {

    this.DEBUG = DEBUG;

    const PATH_PARAM_REGEXP = "([^\\/]+)";
    let prefix = options.prefix || "";

    this.DEBUG("Compiling path configurations");

    this.compiledPaths = options.paths.map((pathDef) => {
        let result = {
            params: [],
            definition: {
                method: Array.isArray(pathDef.method) ? pathDef.method : [pathDef.method],
                path: prefix + pathDef.path,
                requestHandler: pathDef.requestHandler,

                use : [].concat(options.use || []).concat(pathDef.use || []),
                schema: pathDef.schema
            }
        };

        let paramTokenIndex;
        let path = (prefix + pathDef.path).replace(/\//g, '\\/');
        while ((paramTokenIndex = path.indexOf("{")) != -1) {
            let endIndex = path.indexOf("}", paramTokenIndex);
            let param = path.substring(paramTokenIndex + 1, endIndex);

            result.params.push(param);

            path = path.replace("{" + param + "}", PATH_PARAM_REGEXP);
        }

        result.pathRegexp = '^' + path + '$';

        SPI_PLUGINS.forEach((spi) => {
            this.DEBUG("Executing SPI plugin " + spi.name + " for path " + pathDef.path);

            spi.handler(result, pathDef, options);
        });

        return result;
    });

    if (options.debug) {
        this.compiledPaths.push({
            params: [],
            pathRegexp : '^/' + prefix + '_paths$',
            definition: {
                method: ['GET'],
                path: prefix + '/_paths',
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
    this.DEBUG("Finding API request based on path {0}", req.path);

    let pathToFind = req.path;
    if (pathToFind == null || pathToFind == '') {
        pathToFind = '/';
    }

    this.DEBUG("Path to find is {0}", pathToFind);

    let apiRequests = this.compiledPaths.map((compiledPath) => {
        let regExp = new RegExp(compiledPath.pathRegexp, "g");
        let match_path = regExp.exec(pathToFind);

        let matches_method = compiledPath.definition.method.indexOf(req.method) != -1;

        /*
         *  Support for CORS, in case CORS is enabled on multiple identical paths, with different methods, this algorithm
         *  will find multiple apiRequests. We're selecting the one with the correct "Access-Control-Request-Method" header.
         */
        let matches_cors_method = !compiledPath.definition.cors || req.method != "OPTIONS" ||
            compiledPath.definition.method.indexOf(req.headers["access-control-request-method"]) != -1;

        let match = (match_path != null) && matches_method && matches_cors_method;

        this.DEBUG("Compiled path with path regexp: {0} and method {1} matches: {2}", compiledPath.pathRegexp, compiledPath.definition.method, {
            match: match,
            match_path : match_path,
            matches_method : matches_method,
            matches_cors_method: matches_cors_method
        });

        if (match) {
            let apiRequest = {
                params : {},
                api: compiledPath.definition
            };

            for (let i = 0 ; i < match_path.length - 1; i++) {
                apiRequest.params[compiledPath.params[i]] = match_path[i + 1];
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
            DEBUG("Found {0} matches for request to path {2}", apiRequests.length, pathToFind);

            // No exact match found
            throw new Error("Invalid path configuration, not unique path");
        }
    }

    return apiRequests.length ? apiRequests[0] : null;
};

PathController.prototype.nextHandler = function(apiRequest, req, res) {
    req._middlewareIter = 0;

    this.DEBUG("Creating handler iteration function");

    let that = this;

    let next = (err) => {

        that.DEBUG("Running handler iteration, step is {0}", req._middlewareIter);

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
            that.DEBUG("Previous handler resulted in an error, finding error middleware. Error was {0}", err);

            let middleware = findMiddleware(req, 4);
            middleware(err, req, res, next);
        } else {
            that.DEBUG("Finding regular next middleware");

            let middleware = findMiddleware(req, 3);
            if (middleware) {
                that.DEBUG("Next middleware found, calling middleware");

                middleware(req, res, next);
            } else {
                that.DEBUG("No more middleware found, calling request handler of API Request");

                apiRequest.api.requestHandler(req, res);
            }
        }
    };

    return next;
};

PathController.prototype.executeRequest = function(req, res) {
    this.DEBUG("Received request, finding API request");

    let apiRequest = this.toApiRequest(req);
    if (apiRequest) {
        this.DEBUG("API Request found, calling handler chain");

        req.params = apiRequest.params;

        let next = this.nextHandler(apiRequest, req, res);
        next();

        this.DEBUG("Handler chain has ended, execution finished");
    } else {
        this.DEBUG("No API Request found for request, sending error 404 as response");

        res.status(status.NOT_FOUND).send();
    }
};

module.exports = PathController;
