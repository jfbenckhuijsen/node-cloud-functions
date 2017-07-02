const Joi = require('joi');

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
                res.status(500).send(JSON.stringify({
                    message: err.toString(),
                    stacktrace: err.stack
                }));
            }
        } else {
            res.status(200).send(result);
        }
    }
}
function validatePayload(req, res, schema, callback) {
    validateObject(req.body, schema, (err, value) => {
        if (err) {
            res.status(401).send(err.details.map((detail) => {
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
