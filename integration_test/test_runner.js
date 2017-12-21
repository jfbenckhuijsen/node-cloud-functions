"use strict";

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

const superagent    = require('superagent');
const PubSub        = require('@google-cloud/pubsub');
const chai          = require('chai');
const expect        = chai.expect;
const fs            = require('fs');
const path          = require('path');
const spawn          = require('child_process').spawn;

function do_spawn(script, args, callback) {
    let child = spawn(__dirname + '/' + script, args);

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

function getDirectories (srcpath) {
    console.log("Searching directories in " + srcpath);
    return fs.readdirSync(srcpath)
        .filter(file => {
            let is_dir = fs.lstatSync(path.join(srcpath, file)).isDirectory();
            console.log("Checking file " + file + " -> " + is_dir);
            return is_dir;
        })
}

function getDirectoryType(srcpath, directory) {
    let subdir = directory.substring(srcpath.length + 1);
    let underscore = subdir.indexOf("_");
    return subdir.substring(0, underscore);
}

const gcloud_strategy = {
    deploy: (directory, func, done) => {
        let directoryType = getDirectoryType(__dirname, directory);

        function determine_trigger() {

            if (directoryType === "http") {
                return "--trigger-http"
            } else if (directoryType === "message") {
                let topic = process.env.TEST_TOPIC;
                if (!topic) {
                    throw new Error("No trigger topic configured");
                }

                return "--trigger-topic " + topic;
            } else {
                throw new Error("Unknown directory type " + directoryType);
            }
        }

        let bucket = process.env.DEPLOY_BUCKET;
        if (!bucket) {
            throw new Error("No deployment bucket configured");
        }

        let trigger = determine_trigger(directory);

        do_spawn('deploy.sh', [directory, func, bucket, trigger], (code) => {
            if (code === 0) {
                if (directoryType === "http") {
                    fs.readFile(directory + '/deploy_url', "utf8", (err, deploy_url) => {
                        if (err) {
                            done(err);
                        }
                        if (deploy_url === "") {
                            done(new Error("No deploy url found"));
                        } else {
                            done(null, deploy_url.trim());
                        }
                    });
                } else {
                    done(null, "");
                }
            }  else {
                done(new Error("Deploy code: " + code));
            }
        });
    },

    undeploy: (func, done) => {
        let child = do_spawn('undeploy.sh', [func], (code) => {
            if (code === 0) {
                done();
            }  else {
                done(new Error("Deploy code: " + code));
            }
        });

        child.stdin.write("Y\n");
    },

    messageSender: (message) => {
        // Instantiates a client
        const pubsub = PubSub();

        let topicName = process.env.TEST_TOPIC;
        if (!topicName) {
            throw new Error("No test topic configured for message services.");
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

        let topicName = process.env.REPLY_TOPIC;
        if (!topicName) {
            throw new Error("No reply topic configured for message services.");
        }

        // References an existing topic, e.g. "my-topic"
        const topic = pubsub.topic(topicName);

        let subscription;
        topic.createSubscription("test-subscription", (err, sub) => {
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
    }
};

const emulator_strategy = {

};

describe("It should run all integration tests for ", function() {

    this.timeout(200000);

    getDirectories(__dirname).forEach((dirname) => {
        const directory = __dirname + '/' + dirname;
        const tester = directory + '/test.js';
        const func = dirname.replace(/_/g, '-');
        const runnerStrategy = gcloud_strategy; // TODO: Configurable

        if (fs.existsSync(tester)) {
            describe("all test in " + directory + ":", () => {

                let config = {

                };

                before((done) => {
                    runnerStrategy.deploy(directory, func, (err, deploy_url) => {
                        console.log("Configured endpoint URL as :" + deploy_url);

                        config.deploy_url = deploy_url;

                        console.log('*****************************************************************************');
                        done(err);
                    });
                });

                const createTests = require(tester);
                let directoryType = getDirectoryType(__dirname, directory);

                if (directoryType === "http") {
                    createTests(it, superagent, expect, config);
                } else if (directoryType === "message") {
                    createTests(it, runnerStrategy.messageSender, runnerStrategy.messageClient, expect, config);
                } else {
                    throw new Error("Unknown directory type " + directoryType);
                }

                after((done) => {
                    runnerStrategy.undeploy(func, done);
                });

            })
        }
    });
});
