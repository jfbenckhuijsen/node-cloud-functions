"use strict";

const CloudFunctions = require('cloud-functions')(__dirname + '/config.json', '');
const passport      = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;

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

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

module.exports = CloudFunctions.restServiceModule({
    name: 'http-service-auth',
    cors: false,
    authStrategies : {
        default: passport.authenticate('basic', {session: false})
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
