const functions = require('firebase-functions');

module.exports = () => ({
  debug(message, data) {
    functions.logger.debug(message, data || {});
  },
  info(message, data) {
    functions.logger.info(message, data || {});
  },
  warning(message, data) {
    functions.logger.warning(message, data || {});
  },
  error(message, data) {
    functions.logger.error(message, data || {});
  },
});
