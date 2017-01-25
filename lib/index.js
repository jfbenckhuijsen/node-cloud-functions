"use strict";

const Joi = require('joi');
const jwt = require('jsonwebtoken');
const Confidence = require('confidence');

function createLogger() {

    function createLogMessage(message, data) {
        data = data || {};
        data.message = message;
        return JSON.stringify(data);
    }

    return {
        debug: function(message, data) {
            console.log("DEBUG:" + createLogMessage(message, data));
        },
        info : function(message, data) {
            console.log("INFO:" + createLogMessage(message, data));
        },
        warning: function(message, data) {
            console.log("WARN:" + createLogMessage(message, data));
        },
        error: function(message, data) {
            console.error(createLogMessage(message, data));
        }
    };
}

function validateObject(object, schema, callback) {
    if (schema) {
        Joi.validate(object, Joi.object().keys(schema), callback);
    } else {
        callback();
    }
}

function resultHandler(res) {
    return (result, err) => {
        if (err) {
            if (err.isBoom) {
                res.status(err.output.statusCode).send(err.output.payload);
            } else {
                res.status(500).send(JSON.stringify(err));
            }
        } else {
            res.status(200).send(result);
        }
    }
}
function validatePayload(req, res, schema, onsuccess) {
    validateObject(req.body, schema, (err, value) => {
        if (err) {
            res.status(401).send(JSON.stringify(err.details.map((detail) => {
                return {
                    message: detail.message,
                    path: detail.path
                };
            })))
        } else {
            onsuccess(createLogger());
        }
    });
}

function request(req, res, payloadSchema, onsuccess) {
    validatePayload(req, res, payloadSchema, (LOGGER) => onsuccess(LOGGER, req, res, resultHandler(res)));
}

module.exports = function(configFile, configTreePath) {
    const store = new Confidence.Store(require(configFile));
    const manifest = store.get(configTreePath, { env: process.env.NODE_ENV });

    var pluginOptions = function (node) {
        if (!node) {
            return manifest;
        } else {
            return manifest[node];
        }
    };

    var spi = {
        request : request,
        pluginOptions: pluginOptions
    };

    var platform = pluginOptions('platform');
    var delegate;
    if (platform == "AWS") {
        delegate = require('./aws_delegate');
    } else if (platform == "GCF") {
        delegate = require('./google_delegate');
    } else {
        throw "Can't load platform from options:" + JSON.stringify(manifest);
    }
    delegate.init(spi);

    /*
     var localServices = {};

     Injector.delegate(function(serviceName) {
        if (localServices[serviceName]) {
            return localServices[serviceName];
        } else {
            // TODO: Via SNS
        }
    });
     // TODO: Injector.

*/

    var jwt = pluginOptions('jwt');
    return {
        pluginOptions: pluginOptions,
        restServiceModule: delegate.restServiceModule,
        db: delegate.db,

        //localServices: localServices,
//        injector: delegate.injector,
//        frontController: delegate.frontController,
//        authorize: delegate.authorize(jwt.secret, jwt.options),
        //validateObject: validateObject,
        //validatePayload: validatePayload,


    };
};
