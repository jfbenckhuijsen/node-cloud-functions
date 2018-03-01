"use strict";

const status = require('http-status');

function create_validate_middleware(schema) {
    const Joi = require('joi');

    return (req, res, next) => {
        Joi.validate(req.body, Joi.object().keys(schema), (err, value) => {
            if (err) {
                res.status(status.BAD_REQUEST).send(err.details.map((detail) => {
                    return {
                        message: detail.message,
                        path: detail.path
                    };
                }))
            } else {
                next();
            }
        });
    }
}

module.exports =  {
    name: "Validate schema",
    priority: 50,
    handler: (restpath, pathDef, options) => {
        let schema = pathDef.schema;
        if (schema) {
            restpath.definition.use = restpath.definition.use.concat([create_validate_middleware(schema)]);
        }
    }
};
