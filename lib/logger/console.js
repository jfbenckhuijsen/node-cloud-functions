module.exports = () => {
  function createLogMessage(message, data) {
    data = data || {};
    data.message = message;
    return JSON.stringify(data);
  }

  return {
    debug(message, data) {
      // eslint-disable-next-line no-console
      console.log(`DEBUG:${createLogMessage(message, data)}`);
    },
    info(message, data) {
      // eslint-disable-next-line no-console
      console.log(`INFO:${createLogMessage(message, data)}`);
    },
    warning(message, data) {
      // eslint-disable-next-line no-console
      console.log(`WARN:${createLogMessage(message, data)}`);
    },
    error(message, data) {
      // eslint-disable-next-line no-console
      console.error(createLogMessage(message, data));
    },
  };
};
