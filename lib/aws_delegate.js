/*
 ISC License

 Copyright (c) 2017 Jeroen Benckhuijsen

 Permission to use, copy, modify, and/or distribute this software for any
 purpose with or without fee is hereby granted, provided that the above
 copyright notice and this permission notice appear in all copies.

 THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 PERFORMANCE OF THIS SOFTWARE.
 */

"use strict";

var theSpi;

/*
 function generatePolicy(principalId, effect, resource) {
 const authResponse = {};
 authResponse.principalId = principalId;
 if (effect && resource) {
 const policyDocument = {};
 policyDocument.Version = '2012-10-17';
 policyDocument.Statement = [];
 const statementOne = {};
 statementOne.Action = 'execute-api:Invoke';
 statementOne.Effect = effect;
 statementOne.Resource = resource;
 policyDocument.Statement[0] = statementOne;
 authResponse.policyDocument = policyDocument;
 }
 return authResponse;
 }

 */

module.exports = {

    db: null,

    init: function (pluginOptions) {
        var dynamoose = require('dynamoose');
        dynamoose.AWS.config.update(pluginOptions('aws'));
        AwsDelegate.db = {
            Dynamoose: dynamoose
        };
    },


    restServiceModule: function(options) {

    },

    // TODO

    request: function (payloadSchema, onsuccess) {
        return (event, context, callback) => {
            var req = {
                body: event
                // TODO: params
            };

            var res = {
                _status: null,

                send: function (body) {
                    callback(null, {
                        statusCode: res._status,
                        body: body
                    });
                },

                status: function (status) {
                    res._status = status;
                }

                // TODO: req.ip
                // TODO: req.auth.credentials.userName
            };

            request(req, res, payloadSchema, onsuccess);
        };
    },

    frontController: function (paths) {
        return null;
    },

    authorize: (secret, options) => {
        (event, context, callback) => {

            var token = event.authorizationToken.substring("Bearer ".length());

            jwt.verify(token, secret, options, function (err, verifiedJwt) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, generatePolicy(verifiedJwt.body.sub, 'Allow', event.methodArn));
                }
            });
        }
    }

};

