'use strict';

describe('MessageController.js', () => {
  let MessageController = require('../lib/message_controller');
  let DEBUG = console.log;

  it('should call the passed handler', (done) => {
    let event = {
      data: {
        data: new Buffer('Hello World')
      }
    };
    MessageController(DEBUG, (Logger, event) => {
      done();
    })(event);
  });

  it('should return the promise of the handler', (done) => {
    let event = {
      data: {
        data: new Buffer('Hello World')
      }
    };
    let promise = MessageController(DEBUG, (Logger, event) => {

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 200);
      });
    })(event);

    promise.then(() => {
      done();
    });
  });

  it('should return a promise by itself and resolve this in case the handler doesn\'t', (done) => {
    let event = {
      data: {
        data: new Buffer('Hello World')
      }
    };
    let promise = MessageController(DEBUG, (Logger, event) => {
    })(event);

    promise.then(() => {
      done();
    });
  });

  it('should augement the event with a json property', (done) => {
    let event = {
      data: {
        data: new Buffer(JSON.stringify({ message: 'Hello World' }))
      }
    };

    let promise = MessageController(DEBUG, (Logger, event) => {

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (event.json.message === 'Hello World') {
            resolve();
          } else {
            reject();
          }
        }, 200);
      });
    })(event);

    promise.then(() => {
      done();
    });
  });

  it('should not augement the event with a json property in case it exists', (done) => {
    let event = {
      data: {
        data: new Buffer('Hello World')
      },
      json: 'This is JSON'
    };
    let promise = MessageController(DEBUG, (Logger, event) => {

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (event.json === 'This is JSON') {
            resolve();
          } else {
            reject();
          }
        }, 200);
      });
    })(event);

    promise.then(() => {
      done();
    });
  });

  it('should augement the event with a stringData property', (done) => {
    let event = {
      data: {
        data: new Buffer('Hello World')
      }
    };

    let promise = MessageController(DEBUG, (Logger, event) => {

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (event.stringData === 'Hello World') {
            resolve();
          } else {
            reject();
          }
        }, 200);
      });
    })(event);

    promise.then(() => {
      done();
    });
  });

  it('should not augement the event with a stringData property in case it exists', (done) => {
    let event = {
      data: {
        data: new Buffer('Hello World')
      },
      stringData: 'This is stringdata'
    };
    let promise = MessageController(DEBUG, (Logger, event) => {

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (event.stringData === 'This is stringdata') {
            resolve();
          } else {
            reject();
          }
        }, 200);
      });
    })(event);

    promise.then(() => {
      done();
    });
  });
});
