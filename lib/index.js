"use strict";

const jwt = require('jsonwebtoken');
const Confidence = require('confidence');
const Request = require('./request.js');

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
        request : Request,
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
