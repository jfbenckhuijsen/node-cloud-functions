module.exports = (it, messageSender, messageClient, expect, _config) => {
  it('--> should perform a basic hello world call', (done) => {
    let reply;
    messageClient((message) => {
      console.log(`***** Received reply from topic: ${message.data}`);
      reply = `${message.data}`;
    });

    messageSender(process.env.REPLY_TOPIC);

    setTimeout(() => {
      console.log('***** Wait timeout reached, checking if reply has been received');
      expect(reply).to.not.be.null;
      expect(reply)
        .to
        .equal(process.env.REPLY_TOPIC);
      done();
    }, 10000);
  });
};
