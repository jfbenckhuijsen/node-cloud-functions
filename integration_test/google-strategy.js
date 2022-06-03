const fs = require('fs');
const superagent = require('superagent');

const spawn = require('./spawner');
const { MessageSender, MessageClient } = require('./pubsub')();

module.exports = () => ({
  init: () => {},

  deinit: () => {},

  deploy: (directory, func, directoryType, done) => {
    function determineTrigger() {
      if (directoryType === 'http') {
        return '--trigger-http';
      } if (directoryType === 'message') {
        const topic = func;
        return `--trigger-topic ${topic}`;
      }
      throw new Error(`Unknown directory type ${directoryType}`);
    }

    const trigger = determineTrigger(directory);

    spawn('deploy.sh', [directory, func, trigger])
      .then(() => {
        if (directoryType === 'http') {
          fs.readFile(`${directory}/deploy_url`, 'utf8', (err, deployUrl) => {
            if (err) {
              done(err);
            }
            if (deployUrl === '') {
              done(new Error('No deploy url found'));
            } else {
              done(null, deployUrl.trim(), superagent);
            }
          });
        } else {
          done(null, '');
        }
      })
      .catch((code) => done(new Error(`Deploy code: ${code}`)));
  },

  undeploy: (func, done) => {
    const child = spawn('undeploy.sh', [func])
      .then(done)
      .catch((code) => done(new Error(`Deploy code: ${code}`)));

    child.stdin.write('Y\n');
  },

  messageSender: MessageSender,

  messageClient: MessageClient,
});
