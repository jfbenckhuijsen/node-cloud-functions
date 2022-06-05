const functions = require('firebase-functions');

function createLogMessage(message, data) {
  return {
    message,
    data,
  };
}

module.exports = () => ({
  debug(message, data) {
    functions.logger.debug(createLogMessage(message, data));
  },
  info(message, data) {
    functions.logger.info(createLogMessage(message, data));
  },
  warning(message, data) {
    functions.logger.warning(createLogMessage(message, data));
  },
  error(message, data) {
    functions.logger.error(createLogMessage(message, data));
  },
});
