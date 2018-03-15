"use strict";

const Joi = require('joi');

module.exports =  {
    name: "CORS",
    priority: 10,
    handler: (restpath, pathDef, options) => {
        if (pathDef.cors || (options.cors !== undefined && options.cors != false)) {
            const cors = require('cors');

            restpath.appendMiddleware(cors());/* TODO: Add supprt for CORS options */
            restpath.definition.method = restpath.definition.method.concat('OPTIONS');
            restpath.definition.cors = pathDef.cors || options.cors;
        }
    }
};
