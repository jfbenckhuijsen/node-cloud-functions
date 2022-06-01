const { PubSub } = require('@google-cloud/pubsub');
const { expect } = require('chai');

module.exports = (apiEndpoint, projectId) => {
  // Instantiates a client
  const pubsub = new PubSub({ apiEndpoint, projectId });

  const messageSender = (topicName, message) => {
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
  };

  const messageClient = async (topicName, callback) => {
    // References an existing topic, e.g. "my-topic"
    const topic = await pubsub.topic(topicName);
    const [topicExists] = await topic.exists();
    if (!topicExists) {
      await topic.create();
    }

    let subscription;
    await topic.createSubscription(`${topicName}-subscription`, (err, sub) => {
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
  };

  const createEventSubscription = async (topicName, endpoint, project) => {
    const topic = await pubsub.topic(topicName);
    const [topicExists] = await topic.exists();
    if (!topicExists) {
      await topic.create();
    }
    await topic.createSubscription(`${topicName}_subscription`, {
      pushEndpoint: `http://${endpoint}/projects/${project}/topics/${topicName}`,
    });
  };

  return {
    MessageSender: messageSender,
    MessageClient: messageClient,
    CreateEventSubscription: createEventSubscription,
  };
};
