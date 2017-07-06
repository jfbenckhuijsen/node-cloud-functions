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

const Joi = require('joi');
const status = require('http-status');

function createLogger() {

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
}

function validateObject(object, schema, callback) {
    if (schema) {
        Joi.validate(object, Joi.object().keys(schema), callback);
    } else {
        callback();
    }
}

function resultHandler(res) {
    return (result, err) => {
        if (err) {
            if (err.isBoom) {
                res.status(err.output.statusCode).send(err.output.payload);
            } else {
                res.status(status.INTERNAL_SERVER_ERROR).send(JSON.stringify({
                    message: err.toString(),
                    stacktrace: err.stack
                }));
            }
        } else {
            res.status(status.OK).send(result);
        }
    }
}
function validatePayload(req, res, schema, callback) {
    validateObject(req.body, schema, (err, value) => {
        if (err) {
            res.status(status.BAD_REQUEST).send(err.details.map((detail) => {
                return {
                    message: detail.message,
                    path: detail.path
                };
            }))
        } else {
            callback(createLogger());
        }
    });
}

function request(req, res, payloadSchema, onsuccess) {
    const handle = resultHandler(res);
    res.handle = handle;
    const callback =  (LOGGER) => onsuccess(LOGGER, req, res, handle);

    try {
        validatePayload(req, res, payloadSchema, callback);
    } catch (err) {
        console.log(err);
        handle(null, err);
    }
}

module.exports = request;
