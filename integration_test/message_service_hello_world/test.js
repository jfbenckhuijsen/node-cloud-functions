module.exports = (it, runnerStrategy, expect, config) => {
  it('--> should perform a basic hello world call', () => new Promise((resolve, reject) => {
    runnerStrategy.messageClient(config.replyTopic, (message) => {
      console.log(`***** Received reply from topic: ${message.data}`);
      const reply = message.data.toString();
      if (reply === config.replyTopic) {
        resolve();
      } else {
        reject(new Error(`reply is not the replyTopic, but ${reply}`));
      }
    }).then(() => {
      const message = config.replyTopic;
      runnerStrategy.messageSender(config.topic, message);
    }).catch((err) => reject(err));
  }));
};
