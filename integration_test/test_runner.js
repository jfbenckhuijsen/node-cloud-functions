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
    return fs.readdirSync(srcpath)
        .filter(file => fs.lstatSync(path.join(srcpath, file)).isDirectory())
}

const gcloud_strategy = {
    deploy: (directory, func, done) => {
        let bucket = process.env.DEPLOY_BUCKET;
        if (!bucket) {
            throw new Error("No deployment bucket configured");
        }

        do_spawn('deploy.sh', [directory, func, bucket], (code) => {
            if (code == 0) {
                fs.readFile(directory + '/deploy_url', "utf8", (err, deploy_url) => {
                    if (err) {
                        done(err);
                    }
                    if (deploy_url == "") {
                        done(new Error("No deploy url found"));
                    }
                    done(null, deploy_url.trim());
                });
            }  else {
                done(new Error("Deploy code: " + code));
            }
        });
    },

    undeploy: (func, done) => {
        let child = do_spawn('undeploy.sh', [func], (code) => {
            if (code == 0) {
                done();
            }  else {
                done(new Error("Deploy code: " + code));
            }
        });

        child.stdin.write("Y\n");
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
        const deployStrategy = gcloud_strategy; // TODO: Configurable

        if (fs.existsSync(tester)) {
            describe("all test in " + directory + ":", () => {

                let config = {

                };

                before((done) => {
                    deployStrategy.deploy(directory, func, (err, deploy_url) => {
                        console.log("Configured endpoint URL as :" + deploy_url);

                        config.deploy_url = deploy_url;

                        console.log('*****************************************************************************')
                        done(err);
                    });
                });

                after((done) => {
                    deployStrategy.undeploy(func, done);
                });

                const createTests = require(tester);
                createTests(it, superagent, expect, config);
            })
        }
    });
});
