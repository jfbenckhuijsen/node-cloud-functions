"use strict";

const CloudServant  = require('cloud-servant')(__dirname + '/config.json', '');
const fs            = require('fs');
const path          = require('path');


module.exports = CloudServant.messageModule({
    name: 'message-service-hello-world',
    debug: true,
    handler: function(LOGGER, event) {
        LOGGER.debug("Received request on hello world message service");

        return new Promise(function (resolve, reject) {
            LOGGER.info("Type of data: " + typeof event.data);
            LOGGER.info("Hello World " + event.stringData);
        });
    }
});
