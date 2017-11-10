"use strict";

module.exports = {

    spi : null,
    db: {
        mockDb: true
    },

    init: function(spi) {
        module.exports.spi = spi;
    },

    restServiceModule: function(config) {
        let result = {};

        result[config.name] = function() {
            return "MockRest: " + config.name;
        };

        return result;
    },

    messageModule: function(config) {
        let result = {};

        result[config.name] = function() {
            return "MockMessage: " + config.name;
        };

        return result;
    }
};
