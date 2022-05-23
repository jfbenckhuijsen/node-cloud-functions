/**
 * Integration test runnner. This class scans all subdirectories for a test.js file. If found, it deploy the
 * function in this directory and runs the tests in test.js.
 *
 * test.js must export a function (it, superagent, expect, config), where:
 * * it is mocha it(string, ()=>{})
 * * superagent is superagent request object
 * * expect is chai.expect
 * * config is an object with a single field deploy_url, where the function is deployed to
 *
 * When deploying to GCloud, an environment variable named DEPLOY_BUCKET is expected to be set to use for deployment and
 * a default project needs to be seleced using `gcloud config set project`.
 */

const superagent = require('superagent');
const PubSub = require('@google-cloud/pubsub');
const chai = require('chai');

const { expect } = chai;
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function doSpawn(script, args, callback) {
  const child = spawn(`${__dirname}/${script}`, args);

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    callback(code);
  });

  return child;
}

function getDirectories(srcpath) {
  console.log(`Searching directories in ${srcpath}`);
  return fs.readdirSync(srcpath)
    .filter((file) => {
      const isDir = fs.lstatSync(path.join(srcpath, file))
        .isDirectory();
      console.log(`Checking file ${file} -> ${isDir}`);
      return isDir;
    });
}

function getDirectoryType(srcpath, directory) {
  const subdir = directory.substring(srcpath.length + 1);
  const underscore = subdir.indexOf('_');
  return subdir.substring(0, underscore);
}

const gcloudStrategy = {
  deploy: (directory, func, done) => {
    const directoryType = getDirectoryType(__dirname, directory);

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

    doSpawn('deploy.sh', [directory, func, bucket, trigger], (code) => {
      if (code === 0) {
        if (directoryType === 'http') {
          fs.readFile(`${directory}/deploy_url`, 'utf8', (err, deployUrl) => {
            if (err) {
              done(err);
            }
            if (deployUrl === '') {
              done(new Error('No deploy url found'));
            } else {
              done(null, deployUrl.trim());
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
    const child = doSpawn('undeploy.sh', [func], (code) => {
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
};

const emulatorStrategy = {};

describe('It should run all integration tests for ', function () {
  this.timeout(200000);

  getDirectories(__dirname)
    .forEach((dirname) => {
      const directory = `${__dirname}/${dirname}`;
      const tester = `${directory}/test.js`;
      const func = dirname.replace(/_/g, '-');
      const runnerStrategy = gcloudStrategy; // TODO: Configurable

      if (fs.existsSync(tester)) {
        describe(`all test in ${directory}:`, () => {
          const config = {};

          before((done) => {
            runnerStrategy.deploy(directory, func, (err, deploy_url) => {
              console.log(`Configured endpoint URL as :${deploy_url}`);

              config.deploy_url = deploy_url;

              console.log('*****************************************************************************');
              done(err);
            });
          });

          const createTests = require(tester);
          const directoryType = getDirectoryType(__dirname, directory);

          if (directoryType === 'http') {
            createTests(it, superagent, expect, config);
          } else if (directoryType === 'message') {
            createTests(it, runnerStrategy.messageSender, runnerStrategy.messageClient, expect, config);
          } else {
            throw new Error(`Unknown directory type ${directoryType}`);
          }

          after((done) => {
            runnerStrategy.undeploy(func, done);
          });
        });
      }
    });
});
