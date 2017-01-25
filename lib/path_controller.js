"use strict";

/**
 *
 * @param paths
 * @param options JSON object with structure: {
 *  paths: The path definitions and handlers/controllers to call. Array where each object has a structure: [
 *      {
        method: [String, HTTP Verb of the method],
        path: [Path of the rest service, may contain parameters enclosed in curly braces],
        auth: [Whether authentication is needed],
        requestHandler: [Function called when this path is matched],
        cors: [Override global enabling of CORS on a per path basis]
        }
 *  ],
 *  enableCors: whether to also send preflight responses for CORS requests for each of the paths.
 *
 * }
 * @constructor
 */
var PathController = function(options) {
    const PATH_PARAM_REGEXP = "(.*)";

    this.compiledPaths = options.paths.map((pathDef) => {
        var result = {
            params: [],
            definition: pathDef
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
        return result;
    });

    var corsPaths = this.compiledPaths.filter((path) => {
        if (path.cors != undefined) {
            return path.cors;
        } else {
            return options.enableCors;
        }
    }).map((path) => {
        var result = {
            params: path.params,
            definition : {
                method: 'OPTIONS',
                path: path.definition.path,
                auth: false,
                requestHandler: path.definition.corsHandler || corsHandler /// TODO: Add cors Handler
            },
            pathRegexp : path.pathRegexp
        }
    });

    this.compiledPaths = this.compiledPaths.concat(corsPaths);
};

PathController.prototype.toApiRequest = function(req) {
    var apiRequests = this.compiledPaths.map((compiledPath) => {
        var regExp = new RegExp(compiledPath.pathRegexp, "g");
        var match = regExp.exec(req.path);
        var matches_method = compiledPath.definition.method === req.method;

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
            return apiRequest.api.path === req.path;
        });

        if (apiRequests.length != 1) {
            // No exact match found
            throw new Error("Invalid path configuration, not unique path");
        }
    }

    return apiRequests.length ? apiRequests[0] : null;
};

PathController.prototype.executeRequest = function(req, res, auth) {
    var apiRequest = this.toApiRequest(req);
    if (apiRequest) {
        console.log("Found api request:" + JSON.stringify(apiRequest.api));
        req.params = apiRequest.params;
        if (apiRequest.api.auth) {
            // TODO: Handle auth using delegate
            // TODO: req.auth.credentials.userName
        } else {
            apiRequest.api.requestHandler(req, res);
        }
    } else {
        res.status(404).send();
    }
};

module.exports = PathController;
