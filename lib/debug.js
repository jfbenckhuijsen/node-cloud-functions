"use strict";

if (!String.prototype.format) {
    String.prototype.format = function() {
        let args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? (typeof args[number] != 'string'
                    ? JSON.stringify(args[number])
                        : args[number])
                : match
                ;
        });
    };
}

module.exports = (debug) => {
    return function (message) {
        if (debug) {
            let args = Array.prototype.slice.call(arguments, 1);
            console.log("CF_DEBUG: " + message.format.apply(message, args));
        }
    };
};
