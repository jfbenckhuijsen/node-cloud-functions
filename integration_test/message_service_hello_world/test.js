module.exports = (it, runnerStrategy, expect, config) => {
  it('--> should perform a basic hello world call', (done) => {
    let reply;
    runnerStrategy.messageClient(config.replyTopic, (message) => {
      console.log(`***** Received reply from topic: ${message.data}`);
      reply = `${message.data}`;
    });

    const message = config.replyTopic;
    runnerStrategy.messageSender(config.topic, message);

    setTimeout(() => {
      console.log('***** Wait timeout reached, checking if reply has been received');
      expect(reply).to.not.be.null;
      expect(reply)
        .to
        .equal(config.replyTopic);
      done();
    }, 10000);
  });
};
