"use strict";

/**
 *
 * @param paths
 * @param options JSON object with structure: {
 *  paths: The path definitions and handlers/controllers to call. Array where each object has a structure: [
 *      {
        method: [String, HTTP Verb of the method],
        path: [Path of the rest service, may contain parameters enclosed in curly braces],
        use: [Array of Connect middleware methods, overrides the middleware defined in options for this path],
        requestHandler: [Function called when this path is matched],

        auth: [Whether authentication is needed],
        cors: [Override global enabling of CORS on a per path basis]
        }
 *  ],
 *  use: [Array of Connect middleware methods],
 *  enableCors: whether to also send preflight responses for CORS requests for each of the paths.
 *
 * }
 * @constructor
 */
var PathController = function(options) {
    const PATH_PARAM_REGEXP = "(.*)";

    const cors = require('cors');

    this.compiledPaths = options.paths.map((pathDef) => {
        var result = {
            params: [],
            definition: {
                method: Array.isArray(pathDef.method) ? pathDef.method : [pathDef.method],
                path: pathDef.path,
                requestHandler: pathDef.requestHandler,

                use : pathDef.use || options.use || [],
                schema: pathDef.schema
            }
        };

        var paramTokenIndex;
        var path = pathDef.path.replace(/\//g, '\\/');
        while ((paramTokenIndex = path.indexOf("{")) != -1) {
            var endIndex = path.indexOf("}", paramTokenIndex);
            var param = path.substring(paramTokenIndex + 1, endIndex);

            result.params.push(param);

            path = path.replace("{" + param + "}", PATH_PARAM_REGEXP);
        }

        result.pathRegexp = '^' + path + '$';

        if (pathDef.cors || options.enableCors) {
            result.definition.use = result.definition.use.concat([cors()]);/* TODO: Add supprt for CORS options */
            result.definition.method = result.definition.method.concat('OPTIONS');
        }

        return result;
    });

    this.compiledPaths.push({
        params: [],
        pathRegexp : '^/_paths$',
        definition: {
            method: ['GET'],
            path: '/_paths',
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

    })
};

PathController.prototype.toApiRequest = function(req) {
    var pathToFind = req.path;
    if (pathToFind == null || pathToFind == '') {
        pathToFind = '/';
    }

    var apiRequests = this.compiledPaths.map((compiledPath) => {
        var regExp = new RegExp(compiledPath.pathRegexp, "g");
        var match = regExp.exec(pathToFind);
        var matches_method = compiledPath.definition.method.indexOf(req.method) != -1;

        if (match && matches_method) {
            var apiRequest = {
                params : {},
                api: compiledPath.definition
            };

            for (var i = 0 ; i < match.length - 1; i++) {
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
        var apiRequests = apiRequests.filter((apiRequest) => {
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
    var i = 0;
    var next = () => {
        if (i < apiRequest.api.use.length) {
            var middleware = apiRequest.api.use[i];
            i++;
            middleware(req, res, next);
        } else {
            apiRequest.api.requestHandler(req, res);
        }
    };

    return next;
}

PathController.prototype.executeRequest = function(req, res) {
    console.log("Received request, finding API request");

    var apiRequest = this.toApiRequest(req);
    if (apiRequest) {
        req.params = apiRequest.params;

        var next = nextHandler(apiRequest, req, res);
        next();
    } else {
        res.status(404).send();
    }
};

module.exports = PathController;
