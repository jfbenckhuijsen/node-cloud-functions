"use strict";

const status = require('http-status');

function defaultErrorHandler(err, req, res, next) {
    res.status(status.INTERNAL_SERVER_ERROR).send(JSON.stringify(err));
}

module.exports =  {
    name: "Default error",
    priority: 1000,
    handler: (restpath, pathDef, options) => {
        restpath.insertMiddleware(defaultErrorHandler, this.priority);
    }
};

module.exports.defaultErrorHandler = defaultErrorHandler;
