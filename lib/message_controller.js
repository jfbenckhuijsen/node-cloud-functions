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
          const data = (this.data && this.data.message)
            ? this.data.message.data : (this.data)
              ? this.data.data : null;
          this._stringData = data ? Buffer.from(data, 'base64').toString() : null;
        }
        return this._stringData;
      },
    });
  }
}

module.exports = function (DEBUG, logger, handler) {
  return (event) => {
    DEBUG('Request received');

    augmentEvent(event);

    const result = handler(logger, event);
    return result || new Promise((resolve, _reject) => resolve());
  };
};
