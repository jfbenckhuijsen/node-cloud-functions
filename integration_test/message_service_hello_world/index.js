"use strict";

const CloudServant  = require('cloud-servant')(__dirname + '/config.json', '');
const fs            = require('fs');
const path          = require('path');


module.exports = CloudServant.messageModule({
    name: 'message-service-hello-world',
    handler: function(message) {
        return new Promise(function (resolve, reject) {
            console.log("Hello World " + message.stringData);
            return resolve();
        });
    }
});
