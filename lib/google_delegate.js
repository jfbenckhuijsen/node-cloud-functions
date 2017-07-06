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

        serviceModule[options.name] = (req, res) => {
            DEBUG("Request received");

            pathController.executeRequest(req, res);
        };

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
