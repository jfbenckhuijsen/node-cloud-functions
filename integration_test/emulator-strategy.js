const { GenericContainer } = require('testcontainers');
const functionTesting = require('@google-cloud/functions-framework/testing');
const supertest = require('supertest');
const spawn = require('./spawner');
const pubsub = require('./pubsub');

const project = 'project-test';

module.exports = () => {
  const result = {
    datastoreContainer: undefined,
    pubsubContainer: undefined,
    createEventSubscription: undefined,

    init: () => {
    },

    deinit: () => {
    },

    beforeAll: async () => {
      const datastorePort = 8080;
      const pubsubPort = 8085;

      result.datastoreContainer = await new GenericContainer('google/cloud-sdk')
        .withEnv('DATASTORE_PROJECT_ID', project)
        .withCmd(['gcloud', 'beta', 'emulators', 'datastore', 'start', '--no-store-on-disk', `--host-port=0.0.0.0:${datastorePort}`, `--project=${project}`, '--consistency=1.0'])
        .withExposedPorts(datastorePort)
        .start();

      result.pubsubContainer = await new GenericContainer('google/cloud-sdk')
        .withCmd(['gcloud', 'beta', 'emulators', 'pubsub', 'start', `--project=${project}`])
        .withExposedPorts(pubsubPort)
        .start();

      const datastoreHost = `localhost:${result.datastoreContainer.getMappedPort(datastorePort)}`;
      process.env.DATASTORE_EMULATOR_HOST = datastoreHost;
      process.env.DATASTORE_DATASET = project;
      process.env.DATASTORE_PROJECT_ID = project;
      process.env.DATASTORE_EMULATOR_HOST_PATH = `${datastoreHost}/datastore`;
      process.env.DATASTORE_HOST = `http://${datastoreHost}`;

      const pubsubHost = `localhost:${result.pubsubContainer.getMappedPort(pubsubPort)}`;
      process.env.PUBSUB_HOST = pubsubHost;
      process.env.PUBSUB_PROJECT_ID = project;

      const {
        MessageSender,
        MessageClient,
        CreateEventSubscription,
      } = pubsub(pubsubHost, project);
      result.messageSender = MessageSender;
      result.messageClient = MessageClient;
      result.createEventSubscription = CreateEventSubscription;
    },

    afterAll: async () => {
      await result.datastoreContainer.stop();
      await result.pubsubContainer.stop();
    },

    deploy: (directory, func, directoryType, done) => {
      spawn('setup_npm_link.sh', [__dirname, '..'], () => {
        spawn('setup_npm_link.sh', [__dirname, directory, 'cloud-servant'], () => {
          // eslint-disable-next-line global-require,import/no-dynamic-require
          require(directory);
          const server = functionTesting.getTestServer(func);
          if (!server.address()) {
            server.listen(0);
          }
          const tester = supertest(server);
          console.log(`Server started on ${server.address()}`);

          const { port } = server.address();
          const endpoint = `host.docker.internal:${port}`;

          if (directoryType === 'message') {
            result.createEventSubscription(func, endpoint, project);
          }

          done(null, '', tester);
        });
      });
    },

    undeploy: (func, done) => {
      done();
    },

    messageSender: undefined,

    messageClient: undefined,
  };
  return result;
};