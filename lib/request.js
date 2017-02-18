const Joi = require('joi');

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
                res.status(500).send(JSON.stringify(err));
            }
        } else {
            res.status(200).send(result);
        }
    }
}
function validatePayload(req, res, schema, callback) {
    validateObject(req.body, schema, (err, value) => {
        if (err) {
            res.status(401).send(JSON.stringify(err.details.map((detail) => {
                return {
                    message: detail.message,
                    path: detail.path
                };
            })))
        } else {
            callback(createLogger());
        }
    });
}

function request(req, res, payloadSchema, onsuccess) {
    var resultHandler = resultHandler(res);
    var callback =  (LOGGER) => onsuccess(LOGGER, req, res, resultHandler);

    try {
        validatePayload(req, res, payloadSchema, callback);
    } catch (err) {
        resultHandler(null, err);
    }
}

module.exports = request;
