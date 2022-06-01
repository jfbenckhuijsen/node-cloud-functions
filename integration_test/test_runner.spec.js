/**
 * Integration test runnner. This class scans all subdirectories for a test.js file. If found, it
 * deploy the function in this directory and runs the tests in test.js.
 *
 * test.js must export a function (it, superagent, expect, config), where:
 * * it is mocha it(string, ()=>{})
 * * superagent is superagent request object
 * * expect is chai.expect
 * * config is an object with a single field deploy_url, where the function is deployed to
 *
 * When deploying to GCloud, an environment variable named DEPLOY_BUCKET is expected to be set to
 * use for deployment and a default project needs to be seleced using `gcloud config set project`.
 */

const chai = require('chai');

const { expect } = chai;
const fs = require('fs');
const path = require('path');
const runnerStrategy = require('./emulator-strategy')(); // TODO: Configurable

runnerStrategy.init();

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

// eslint-disable-next-line func-names
describe('It should run all integration tests for ', function () {
  this.timeout(200000);

  before(async () => {
    if (runnerStrategy.beforeAll) {
      await runnerStrategy.beforeAll();
    }
  });

  after(async () => {
    if (runnerStrategy.afterAll) {
      await runnerStrategy.afterAll();
    }
  });

  getDirectories(__dirname)
    .forEach((dirname) => {
      const directory = `${__dirname}/${dirname}`;
      const tester = `${directory}/test.js`;
      const func = dirname.replace(/_/g, '-');

      if (fs.existsSync(tester)) {
        describe(`all test in ${directory}:`, () => {
          const directoryType = getDirectoryType(__dirname, directory);

          const config = {
            topic: func,
            replyTopic: `${func}-reply`,
          };

          before((done) => {
            runnerStrategy.deploy(directory, func, directoryType, (err, deployUrl, superagent) => {
              console.log(`Configured endpoint URL as :${deployUrl}`);

              config.deploy_url = deployUrl;
              config.superagent = superagent;

              console.log('*****************************************************************************');
              done(err);
            });
          });

          // eslint-disable-next-line global-require,import/no-dynamic-require
          const createTests = require(tester);

          if (directoryType === 'http') {
            createTests(it, expect, config);
          } else if (directoryType === 'message') {
            createTests(
              it,
              runnerStrategy.messageSender,
              runnerStrategy.messageClient,
              expect,
              config,
            );
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
