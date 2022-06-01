const { GenericContainer } = require('testcontainers');
const functionTesting = require('@google-cloud/functions-framework/testing');
const supertest = require('supertest');
const spawn = require('./spawner');
const pubsub = require('./pubsub');
const { Server } = require('https');

const project = 'project-test';

module.exports = () => ({
  datastoreContainer: undefined,
  pubsubContainer: undefined,
  createEventSubscription: undefined,

  init: () => {
  },

  deinit: () => {},

  beforeAll: async () => {
    const datastorePort = 8080;
    const pubsubPort = 8085;

    this.datastoreContainer = await new GenericContainer('google/cloud-sdk')
      .withEnv('DATASTORE_PROJECT_ID', project)
      .withCmd(['gcloud', 'beta', 'emulators', 'datastore', 'start', '--no-store-on-disk', `--host-port=localhost:${datastorePort}`, `--project=${project}`, '--consistency=1.0'])
      .withExposedPorts(datastorePort)
      .start();

    this.pubsubContainer = await new GenericContainer('google/cloud-sdk')
      .withCmd(['gcloud', 'beta', 'emulators', 'pubsub', 'start', `--project=${project}`])
      .withExposedPorts(pubsubPort)
      .start();

    process.env.DATASTORE_EMULATOR_HOST = `localhost:${this.datastoreContainer.getMappedPort(datastorePort)}`;
    process.env.DATASTORE_PROJECT_ID = project;

    const pubsubHost = `localhost:${this.pubsubContainer.getMappedPort(pubsubPort)}`;
    process.env.PUBSUB_HOST = pubsubHost;
    process.env.PUBSUB_PROJECT_ID = project;

    const { MessageSender, MessageClient, CreateEventSubscription } = pubsub(pubsubHost, project);
    this.messageSender = MessageSender;
    this.messageClient = MessageClient;
    this.createEventSubscription = CreateEventSubscription;
  },

  afterAll: async () => {
    await this.datastoreContainer.stop();
    await this.pubsubContainer.stop();
  },

  deploy: (directory, func, directoryType, done) => {
    spawn('setup_npm_link.sh', [__dirname, '..'], () => {
      spawn('setup_npm_link.sh', [__dirname, directory, 'cloud-servant'], () => {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        require(directory);
        const server = functionTesting.getTestServer(func);
        const tester = supertest(server);
        console.log(`Server started on ${server.address()}`);

        const { port } = server.address();
        const endpoint = `http://127.0.0.1:${port}`;

        if (directoryType === 'message') {
          this.createEventSubscription(func, endpoint, project);
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
});
