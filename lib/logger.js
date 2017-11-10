"use strict";

module.exports = function() {

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
};
