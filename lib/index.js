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

const Confidence = require('confidence');
const Joi = require('joi');
const Request = require('./request');

function builder(that) {
  const modules = [];

  function add_module(module) {
    Object.keys(module)
      .forEach((key) => {
        modules.forEach((m) => {
          if (Object.keys(m)
            .includes(key)) {
            throw new Error(`Duplicate module key found:${key}`);
          }
        });
      });

    modules.push(module);
  }

  const builder = {
    restServiceModule(options) {
      add_module(that.restServiceModule(options));
      return builder;
    },

    messageModule(options) {
      add_module(that.messageModule(options));
      return builder;
    },

    build() {
      const callarr = [{}].concat(modules);
      return Object.assign.apply(null, callarr);
    },
  };

  return builder;
}

module.exports = (configFile, configTreePath) => {
  console.log(`Starting CloudServant, reading config file ${configFile}`);

  // eslint-disable-next-line global-require,import/no-dynamic-require
  const store = new Confidence.Store(require(configFile));
  const manifest = store.get(configTreePath, { env: process.env.NODE_ENV });
  const BACKENDS = {
    AWS: './aws_delegate',
    Amazon: './aws_delegate',
    GCF: './google_delegate',
    Google: './google_delegate',
    Firebase: './google_delegate',

    Mock: './mock_delegate',
  };

  const pluginOptions = (node) => {
    if (!node) {
      return manifest;
    }
    return manifest[node];
  };

  const spi = {
    request: Request,
    pluginOptions,
  };

  const platform = pluginOptions('platform');
  console.log(`CloudServant platform is ${platform}, loading delegate module`);

  const delegateModule = BACKENDS[platform];
  let delegate;
  if (!delegateModule) {
    throw new Error(`Can't load platform from options:${JSON.stringify(manifest)}`);
  } else {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    delegate = require(delegateModule);
  }

  console.log('Delegate module loaded, initializing');
  delegate.init(spi);

  const result = {
    pluginOptions,
    restServiceModule: delegate.restServiceModule,
    messageModule: delegate.messageModule,
    builder: () => builder(result),
    db: delegate.db,
    Joi,
  };

  console.log('CloudServant initialization done');

  return result;
};
