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

let theSpi;

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

  init(pluginOptions) {
    const dynamoose = require('dynamoose');
    dynamoose.AWS.config.update(pluginOptions('aws'));
    AwsDelegate.db = {
      Dynamoose: dynamoose,
    };
  },

  restServiceModule(options) {

  },

  messageModule(options) {

  },

  // TODO

  request(payloadSchema, onsuccess) {
    return (event, context, callback) => {
      const req = {
        body: event,
        // TODO: params
      };

      const res = {
        _status: null,

        send(body) {
          callback(null, {
            statusCode: res._status,
            body,
          });
        },

        status(status) {
          res._status = status;
        },

        // TODO: req.ip
        // TODO: req.auth.credentials.userName
      };

      request(req, res, payloadSchema, onsuccess);
    };
  },

  frontController(paths) {
    return null;
  },

  authorize: (secret, options) => {
    (event, context, callback) => {
      const token = event.authorizationToken.substring('Bearer '.length());

      jwt.verify(token, secret, options, (err, verifiedJwt) => {
        if (err) {
          callback(err);
        } else {
          callback(null, generatePolicy(verifiedJwt.body.sub, 'Allow', event.methodArn));
        }
      });
    };
  },

};
