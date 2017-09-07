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

const PathController = require('./path_controller.js');
const DebugLogger = require('./debug.js');

let theSpi;

const api = {

    db: null,

    init: function(spi) {
        theSpi = spi;

        const dbOpts = spi.pluginOptions('googleDatastore');

        if (dbOpts) {
            console.log("Starting connection to GCloud Datastore");

            const ds = require('@google-cloud/datastore')(dbOpts);

            const gstore = require('gstore-node');
            gstore.connect(ds);

            api.db = {
                gstore : gstore
            };
        }
    },

    request: function(payloadSchema, onsuccess) {
        return (req, res) => {
            theSpi.request(req, res, payloadSchema, onsuccess);
        };
    },

    restServiceModule : function(options) {
        const DEBUG = DebugLogger(options.debug);

        DEBUG("Initializing CLOUD functions module");

        let serviceModule = {

        };

        DEBUG("Setting up request handlers for paths");

        options.paths.forEach((path) => {
            path.requestHandler = api.request(path.schema, path.handler);
        });

        DEBUG("Setting up path controller");

        const pathController = new PathController(options, DEBUG);

        DEBUG("Setting up main GCloud service module");

        const platform = pluginOptions('platform');
        if (platform == "GCF") {
            serviceModule[options.name] = (req, res) => {
                DEBUG("Request received");

                pathController.executeRequest(req, res);
            };
        } else if (platform == "Firebase") {
            const functions = require('firebase-functions');

            serviceModule[options.name] = functions.https.onRequest((req, res) => {
                DEBUG("Request received");

                pathController.executeRequest(req, res);
            });
        } else {
            throw new Error("Invalid platform " + platform);
        }

        DEBUG("Initialization done");

        return serviceModule;
    },

    /***** DEPRECATED API ***/


    injector: function() {
        // TODO: Injector.
    },

    authorize: (secret, options) => {
        return () => {}
    },

    auth: function() {

    }
};

module.exports = api;
