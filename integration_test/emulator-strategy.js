const { GenericContainer } = require('testcontainers');
const functionTesting = require('@google-cloud/functions-framework/testing');
const supertest = require('supertest');
const spawn = require('./spawner');

module.exports = () => ({
  datastoreContainer: undefined,

  init: () => {
  },

  deinit: () => {},

  beforeAll: async () => {
    this.datastoreContainer = await new GenericContainer('google/cloud-sdk')
      .withEnv('DATASTORE_PROJECT_ID', 'project-test')
      .withCmd(['gcloud', 'beta', 'emulators', 'datastore', 'start', '--no-store-on-disk', '--host-port=localhost:8080', '--project=project-test', '--consistency=1.0'])
      .withExposedPorts(8080)
      .start();

    process.env.DATASTORE_EMULATOR_HOST = `localhost:${this.datastoreContainer.getMappedPort(8080)}`;
    process.env.DATASTORE_PROJECT_ID = 'project-test';
  },

  afterAll: async () => {
    await this.datastoreContainer.stop();
  },

  deploy: (directory, func, directoryType, done) => {
    spawn('setup_npm_link.sh', [__dirname, '..'], () => {
      spawn('setup_npm_link.sh', [__dirname, directory, 'cloud-servant'], () => {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        require(directory);
        const server = functionTesting.getTestServer(func);
        console.log(`Server started on ${server.address()}`);
        done(null, '', supertest(server));
      });
    });
  },

  undeploy: (func, done) => {
    done();
  },

  messageSender: (message) => {

  },

  messageClient: (callback) => {

  },
});
