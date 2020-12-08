"use strict";

function dateStringToSeconds(dateString) {
    const PD = require('parse-duration');
    return dateString ? (PD(dateString) / 1000) : undefined;
}

module.exports =  {
    name: "Caching",
    priority: 400,
    handler: (restpath, pathDef, options) => {
        if (pathDef.cacheHeaders) {
            const ECC = require('express-cache-controller');

            let cacheConfig = {};
            if (pathDef.cacheHeaders.cacheable) {
                let cacheable = pathDef.cacheHeaders.cacheable;

                cacheConfig.noStore = false;
                cacheConfig.noCache = cacheable.revalidate;
                if (cacheable.sharedCaches) {
                    cacheConfig.private = false;
                    cacheConfig.public = true;
                    cacheConfig.noTransform = cacheable.sharedCaches.noTransform;
                    cacheConfig.sMaxAge = dateStringToSeconds(cacheable.sharedCaches.maxAge);
                } else {
                    cacheConfig.private = true;
                }

                if (cacheable.stale) {
                    cacheConfig.staleIfError = dateStringToSeconds(cacheable.stale.ifError);
                    cacheConfig.staleWhileRevalidate = dateStringToSeconds(cacheable.stale.whileRevalidate);
                }
                cacheConfig.maxAge = dateStringToSeconds(cacheable.maxAge);
            } else if (pathDef.cacheHeaders.raw) {
                cacheConfig = pathDef.cacheHeaders.raw;
            } else {
                cacheConfig.noStore = true;
            }

            restpath.insertMiddleware(ECC(cacheConfig), this.priority);
        }
    }
};
