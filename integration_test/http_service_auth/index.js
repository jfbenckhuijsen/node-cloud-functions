"use strict";

const CloudFunctions = require('../../lib/index.js')(__dirname + '/config.json', '');
const passport      = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const base64        = require('base-64');

passport.use(new BasicStrategy(
    function(username, password, done) {
        if (username == "admin" && password == "welcome") {
            return done(null, {
                user: "admin"
            });
        } else {
            return done(null, false);
        }
    }
));

module.exports = CloudFunctions.restServiceModule({
    name: 'http_service_hello_auth_world',
    cors: false,
    authStrategies : {
        default: passport.authenticate('basic')
    },
    paths : [
        {
            method: "POST",
            path: "/",
            auth: true,
            handler: (LOGGER, req, res) => {
                res.send(`Hello ${req.body.name || 'World'}!`);
            }
        }
    ]
});
