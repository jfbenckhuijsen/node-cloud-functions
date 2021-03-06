"use strict";

const CloudServant  = require('cloud-servant')(__dirname + '/config.json', '');
const fs            = require('fs');
const path          = require('path');
const PubSub        = require('@google-cloud/pubsub');
const pubsub = PubSub();



module.exports = CloudServant.messageModule({
    name: 'message-service-hello-world',
    debug: true,
    handler: function(LOGGER, event) {
        LOGGER.debug("Received request on hello world message service");

        return new Promise(function (resolve, reject) {
            LOGGER.info("Type of data: " + typeof event.data);
            LOGGER.info("Reply topic is:  " + event.stringData);
            // References an existing topic, e.g. "my-topic"
            const topic = pubsub.topic(event.stringData);

            // Create a publisher for the topic (which can include additional batching configuration)
            const publisher = topic.publisher();

            const dataBuffer = Buffer.from(event.stringData);
            publisher.publish(dataBuffer)
                .then((results) => {
                    const messageId = results[0];

                    console.log(`Message ${messageId} published.`);

                    return messageId;
            });
        });
    }
});
