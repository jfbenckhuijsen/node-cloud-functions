const MessageController = require('../lib/message_controller');
const logger = require('../lib/logger/console')();

describe('MessageController.js', () => {
  const DEBUG = console.log;

  it('should call the passed handler', (done) => {
    const event = {
      data: {
        data: new Buffer('Hello World'),
      },
    };
    MessageController(DEBUG, logger, (Logger, event) => {
      done();
    })(event);
  });

  it('should return the promise of the handler', (done) => {
    const event = {
      data: {
        data: new Buffer('Hello World'),
      },
    };
    const promise = MessageController(DEBUG, logger, (Logger, event) => new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 200);
    }))(event);

    promise.then(() => {
      done();
    });
  });

  it('should return a promise by itself and resolve this in case the handler doesn\'t', (done) => {
    const event = {
      data: {
        data: new Buffer('Hello World'),
      },
    };
    const promise = MessageController(DEBUG, logger, (Logger, event) => {
    })(event);

    promise.then(() => {
      done();
    });
  });

  it('should augement the event with a json property', (done) => {
    const event = {
      data: {
        data: new Buffer(JSON.stringify({ message: 'Hello World' })),
      },
    };

    const promise = MessageController(DEBUG, logger, (Logger, event) => new Promise((resolve, reject) => {
      setTimeout(() => {
        if (event.json.message === 'Hello World') {
          resolve();
        } else {
          reject();
        }
      }, 200);
    }))(event);

    promise.then(() => {
      done();
    });
  });

  it('should not augement the event with a json property in case it exists', (done) => {
    const event = {
      data: {
        data: new Buffer('Hello World'),
      },
      json: 'This is JSON',
    };
    const promise = MessageController(DEBUG, logger, (Logger, event) => new Promise((resolve, reject) => {
      setTimeout(() => {
        if (event.json === 'This is JSON') {
          resolve();
        } else {
          reject();
        }
      }, 200);
    }))(event);

    promise.then(() => {
      done();
    });
  });

  it('should augement the event with a stringData property', (done) => {
    const event = {
      data: {
        data: new Buffer('Hello World'),
      },
    };

    const promise = MessageController(DEBUG, logger, (Logger, event) => new Promise((resolve, reject) => {
      setTimeout(() => {
        if (event.stringData === 'Hello World') {
          resolve();
        } else {
          reject();
        }
      }, 200);
    }))(event);

    promise.then(() => {
      done();
    });
  });

  it('should not augement the event with a stringData property in case it exists', (done) => {
    const event = {
      data: {
        data: new Buffer('Hello World'),
      },
      stringData: 'This is stringdata',
    };
    const promise = MessageController(DEBUG, logger, (Logger, event) => new Promise((resolve, reject) => {
      setTimeout(() => {
        if (event.stringData === 'This is stringdata') {
          resolve();
        } else {
          reject();
        }
      }, 200);
    }))(event);

    promise.then(() => {
      done();
    });
  });
});
