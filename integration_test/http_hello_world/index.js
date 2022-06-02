const functions = require('@google-cloud/functions-framework');

/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
functions.http('http-hello-world', (req, res) => {
  res.send(`Hello ${req.body.name || 'World'}!`);
});
