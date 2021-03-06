"use strict";

const status = require('http-status');

function create_validate_middleware(schema) {
    const Joi = require('joi');

    return (req, res, next) => {
        const joiSchema = Joi.object(schema);
        const {error} = joiSchema.validate(req.body);
        if (error) {
          res.status(status.BAD_REQUEST).send(error.details.map((detail) => {
            return {
              message: detail.message,
              path: detail.path
            };
          }))
        } else {
          next();
        }
    }
}

module.exports =  {
    name: "Validate schema",
    priority: 500,
    handler: (restpath, pathDef, options) => {
        let schema = pathDef.schema;
        if (schema) {
            restpath.insertMiddleware(create_validate_middleware(schema), module.exports.priority);
        }
    }
};
