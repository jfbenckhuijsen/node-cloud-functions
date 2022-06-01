const fs = require('fs');
const superagent = require('superagent');
const PubSub = require('@google-cloud/pubsub');
const { expect } = require('chai');
const spawn = require('./spawner');

module.exports = () => ({
  init: () => {},

  deinit: () => {},

  deploy: (directory, func, directoryType, done) => {
    function determineTrigger() {
      if (directoryType === 'http') {
        return '--trigger-http';
      } if (directoryType === 'message') {
        const topic = process.env.TEST_TOPIC;
        if (!topic) {
          throw new Error('No trigger topic configured');
        }

        return `--trigger-topic ${topic}`;
      }
      throw new Error(`Unknown directory type ${directoryType}`);
    }

    const bucket = process.env.DEPLOY_BUCKET;
    if (!bucket) {
      throw new Error('No deployment bucket configured');
    }

    const trigger = determineTrigger(directory);

    spawn('deploy.sh', [directory, func, bucket, trigger], (code) => {
      if (code === 0) {
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
      } else {
        done(new Error(`Deploy code: ${code}`));
      }
    });
  },

  undeploy: (func, done) => {
    const child = spawn('undeploy.sh', [func], (code) => {
      if (code === 0) {
        done();
      } else {
        done(new Error(`Deploy code: ${code}`));
      }
    });

    child.stdin.write('Y\n');
  },

  messageSender: (message) => {
    // Instantiates a client
    const pubsub = PubSub();

    const topicName = process.env.TEST_TOPIC;
    if (!topicName) {
      throw new Error('No test topic configured for message services.');
    }

    // References an existing topic, e.g. "my-topic"
    const topic = pubsub.topic(topicName);

    // Create a publisher for the topic (which can include additional batching configuration)
    const publisher = topic.publisher();

    // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
    const dataBuffer = Buffer.from(message);
    return publisher.publish(dataBuffer)
      .then((results) => {
        const messageId = results[0];

        console.log(`Message ${messageId} published.`);

        return messageId;
      });
  },

  messageClient: (callback) => {
    // Instantiates a client
    const pubsub = PubSub();

    const topicName = process.env.REPLY_TOPIC;
    if (!topicName) {
      throw new Error('No reply topic configured for message services.');
    }

    // References an existing topic, e.g. "my-topic"
    const topic = pubsub.topic(topicName);

    let subscription;
    topic.createSubscription('test-subscription', (err, sub) => {
      if (err) {
        expect(err).to.be.null;
        return;
      }

      subscription = sub;

      // Listen to and handle message and error events
      subscription.on('message', callback);
      subscription.on('error', (err) => {
        expect(err).to.be.null;
      });

      console.log(`Listening to ${topicName} with subscription test-subscription`);
    });
  },
});
