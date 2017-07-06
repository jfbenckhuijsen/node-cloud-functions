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
