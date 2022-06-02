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

const status = require('http-status');
const {
  GstoreError,
  ERROR_CODES,
} = require('gstore-node/lib/errors');
const Logger = require('./logger')();

function resultHandler(res) {
  return (result, err) => {
    if (err) {
      if (err.isBoom) {
        res.status(err.output.statusCode)
          .send(err.output.payload);
      } if (err instanceof GstoreError) {
        if (err.code === ERROR_CODES.ERR_ENTITY_NOT_FOUND) {
          res.status(status.NOT_FOUND).send(err.message);
        } else if (err.code === ERROR_CODES.ERR_VALIDATION
                   || err.code === ERROR_CODES.ERR_PROP_IN_RANGE
                   || err.code === ERROR_CODES.ERR_PROP_REQUIRED
                   || err.code === ERROR_CODES.ERR_PROP_NOT_ALLOWED
                   || err.code === ERROR_CODES.ERR_PROP_TYPE
                   || err.code === ERROR_CODES.ERR_PROP_VALUE) {
          res.status(status.BAD_REQUEST).send(err.message);
        } else {
          res.status(status.INTERNAL_SERVER_ERROR).send(err.message);
        }
      } else {
        res.status(status.INTERNAL_SERVER_ERROR)
          .send(JSON.stringify({
            message: err.toString(),
            stacktrace: err.stack,
          }));
      }
    } else {
      res.status(status.OK)
        .send(result);
    }
  };
}

function request(req, res, onsuccess) {
  const handle = resultHandler(res);
  res.handle = handle;

  try {
    onsuccess(Logger, req, res, handle);
  } catch (err) {
    console.log(err);
    handle(null, err);
  }
}

module.exports = request;
