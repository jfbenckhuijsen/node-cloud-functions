const { PubSub } = require('@google-cloud/pubsub');
const { expect } = require('chai');

module.exports = (apiEndpoint, projectId) => {
  // Instantiates a client
  const pubsub = new PubSub({ apiEndpoint, projectId });

  const messageSender = (topicName, message) => {
    // References an existing topic, e.g. "my-topic"
    const topic = pubsub.topic(topicName);

    // Create a publisher for the topic (which can include additional batching configuration)
    const { publisher } = topic;

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

    return topic.createSubscription(`${topicName}-subscription`);
  };

  const createEventSubscription = async (topicName, endpoint, project) => {
    const topic = await pubsub.topic(topicName);
    const [topicExists] = await topic.exists();
    if (!topicExists) {
      await topic.create();
    }
    console.log(`Creating subscription for topic ${topicName} on endpoint  ${endpoint}`);
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