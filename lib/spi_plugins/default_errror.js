"use strict";

const status = require('http-status');

function defaultErrorHandler(err, req, res, next) {
    res.status(status.INTERNAL_SERVER_ERROR).send(JSON.stringify(err));
}

module.exports =  {
    name: "Default error",
    priority: 100,
    handler: (restpath, pathDef, options) => {
        restpath.definition.use = restpath.definition.use.concat(defaultErrorHandler);
    }
};

module.exports.defaultErrorHandler = defaultErrorHandler;