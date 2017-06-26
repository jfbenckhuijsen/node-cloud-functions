"use strict";

var PathController = require('./path_controller.js');

var theSpi;

var api = {

    db: null,

    init: function(spi) {
        theSpi = spi;

        var dbOpts = spi.pluginOptions('googleDatastore');

        if (dbOpts) {
            console.log("Starting connection to GCloud Datastore");

            var ds = require('@google-cloud/datastore')(dbOpts);

            var gstore = require('gstore-node');
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
        var serviceModule = {

        };

        options.paths.forEach((path) => {
            path.requestHandler = api.request(path.schema, path.handler);
        });

        var pathController = new PathController(options);

        serviceModule[options.name] = (req, res) => {
            pathController.executeRequest(req, res);
        };

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
