"use strict";

module.exports =  {
    name: "CORS",
    priority: 100,
    handler: (restpath, pathDef, options) => {
        if (pathDef.cors || (options.cors !== undefined && options.cors != false)) {
            const cors = require('cors');

            restpath.insertMiddleware(cors(), module.exports.priority);/* TODO: Add supprt for CORS options */
            restpath.definition.method = restpath.definition.method.concat('OPTIONS');
            restpath.definition.cors = pathDef.cors || options.cors;
        }
    }
};
