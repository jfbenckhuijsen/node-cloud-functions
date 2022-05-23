module.exports = function () {
  function createLogMessage(message, data) {
    data = data || {};
    data.message = message;
    return JSON.stringify(data);
  }

  return {
    debug(message, data) {
      console.log(`DEBUG:${createLogMessage(message, data)}`);
    },
    info(message, data) {
      console.log(`INFO:${createLogMessage(message, data)}`);
    },
    warning(message, data) {
      console.log(`WARN:${createLogMessage(message, data)}`);
    },
    error(message, data) {
      console.error(createLogMessage(message, data));
    },
  };
};
