module.exports = (it, messageSender, messageClient, expect, config) => {
  it('--> should perform a basic hello world call', (done) => {
    let reply;
    messageClient(config.replyTopic, (message) => {
      console.log(`***** Received reply from topic: ${message.data}`);
      reply = `${message.data}`;
    });

    const message = config.replyTopic;
    messageSender(config.topic, message);

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
