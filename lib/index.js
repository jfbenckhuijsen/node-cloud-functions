"use strict";

const Confidence = require('confidence');
const Request = require('./request.js');

module.exports = function(configFile, configTreePath) {
    const store = new Confidence.Store(require(configFile));
    const manifest = store.get(configTreePath, { env: process.env.NODE_ENV });

    const pluginOptions = function (node) {
        if (!node) {
            return manifest;
        } else {
            return manifest[node];
        }
    };

    const spi = {
        request : Request,
        pluginOptions: pluginOptions
    };

    const platform = pluginOptions('platform');
    let delegate;
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
