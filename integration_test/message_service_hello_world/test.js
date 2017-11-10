"use strict";

const fs            = require('fs');

module.exports = (it, messageSender, expect, config) => {
    it("--> should perform a basic hello world call", (done) => {

        let id = Math.floor(Math.random() * 1000);

        messageSender("" + id);

        setTimeout(done, 3000)
    });
};
