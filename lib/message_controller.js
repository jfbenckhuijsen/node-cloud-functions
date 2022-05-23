const Logger = require('./logger')();

function augmentEvent(event) {
  if (!event.hasOwnProperty('json')) {
    Object.defineProperty(event, 'json', {
      get() {
        if (!this._json) {
          this._json = JSON.parse(this.stringData);
        }
        return this._json;
      },
    });
  }

  if (!event.hasOwnProperty('stringData')) {
    Object.defineProperty(event, 'stringData', {
      get() {
        if (!this._stringData) {
          this._stringData = this.data && this.data.data ? Buffer.from(this.data.data, 'base64')
            .toString() : null;
        }
        return this._stringData;
      },
    });
  }
}

module.exports = function (DEBUG, handler) {
  return (event) => {
    DEBUG('Request received');

    augmentEvent(event);

    const result = handler(Logger, event);
    return result || new Promise((resolve, _reject) => resolve());
  };
};
