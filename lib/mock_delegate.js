module.exports = {

  spi: null,
  db: {
    mockDb: true,
  },

  init(spi) {
    module.exports.spi = spi;
  },

  restServiceModule(config) {
    const result = {};

    result[config.name] = function () {
      return `MockRest: ${config.name}`;
    };

    return result;
  },

  messageModule(config) {
    const result = {};

    result[config.name] = function () {
      return `MockMessage: ${config.name}`;
    };

    return result;
  },
};
