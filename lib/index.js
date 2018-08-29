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

const Confidence = require('confidence');
const Request = require('./request.js');

function builder(that) {
    let modules = [];

    function add_module(module) {
        Object.keys(module).forEach((key) => {
            modules.forEach((module) => {
                if (Object.keys(module).includes(key)) {
                    throw new Error("Duplicate module key found:" + key);
                }
            });
        });

        modules.push(module);
    }

    let builder = {
        restServiceModule: function(options) {
            add_module(that.restServiceModule(options));
            return builder;
        },

        messageModule: function(options) {
            add_module(that.messageModule(options));
            return builder;
        },

        build: function() {
            let callarr = [{}].concat(modules);
            return Object.assign.apply(null, callarr);
        }
    };

    return builder;
}

module.exports = function(configFile, configTreePath) {
    const store = new Confidence.Store(require(configFile));
    const manifest = store.get(configTreePath, { env: process.env.NODE_ENV });
    const BACKENDS = {
        "AWS" : "./aws_delegate",
        "Amazon" : "./aws_delegate",
        "GCF" : "./google_delegate",
        "Google" : "./google_delegate",
        "Firebase" : "./google_delegate",

        "Mock" : "./mock_delegate"
    };

    const pluginOptions = function (node) {
        if (!node) {
            return manifest;
        } else {
            return manifest[node];
        }
    };

    const spi = {
        request : Request,
        pluginOptions: pluginOptions
    };

    const platform = pluginOptions('platform');
    let delegate_module = BACKENDS[platform];
    let delegate;
    if (!delegate_module) {
        throw "Can't load platform from options:" + JSON.stringify(manifest);
    } else {
        delegate = require(delegate_module);
    }
    delegate.init(spi);

    let result = {
        pluginOptions: pluginOptions,
        restServiceModule: delegate.restServiceModule,
        messageModule: delegate.messageModule,
        builder: () => {
            return builder(result)
        },
        integrationTester: (describe, it) => {
            let integration_tester = require('integration_tester');
            return integration_tester(describe, it, delegate);
        },
        db: delegate.db,
    };

    return result;
};
