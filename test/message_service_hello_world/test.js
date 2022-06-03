module.exports = (it, runnerStrategy, expect, config) => {
  it('--> should perform a basic hello world call', () => new Promise((resolve, reject) => {
    runnerStrategy.messageClient(config.replyTopic).then((subResponse) => {
      const subscription = subResponse[0];
      // Listen to and handle message and error events
      subscription.on('message', (message) => {
        console.log(`***** Received reply from topic: ${message.data}`);
        const reply = message.data.toString();
        if (reply === config.replyTopic) {
          subscription.close();
          resolve();
        } else {
          subscription.close();
          reject(new Error(`reply is not the replyTopic, but ${reply}`));
        }
      });
      subscription.on('error', (err) => {
        reject(err);
      });
    }).then(() => {
      const message = config.replyTopic;
      runnerStrategy.messageSender(config.topic, message);
    }).catch((err) => reject(err));
  }));
};
