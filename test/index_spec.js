const chai = require('chai');
const expect = chai.expect;

describe('Index.js', () => {

  let CloudServant = require('../lib/index.js')(__dirname + '/test_config.json', '');

  it('should have a mock database', () => {
    expect(CloudServant.db.mockDb)
      .to
      .equal(true);
  });

  describe(' has delegate methods', () => {
    it('should return a delegate REST module', () => {
      let module = CloudServant.restServiceModule({ name: 'RestTest' });
      expect(module.RestTest())
        .to
        .equal('MockRest: RestTest');
    });

    it('should return a delegate MESSAGE module', () => {
      let module = CloudServant.messageModule({ name: 'MessageTest' });
      expect(module.MessageTest())
        .to
        .equal('MockMessage: MessageTest');
    });

  });

  describe(' with a builder to combine modules', () => {
    it('should not allow identical names', () => {
      let builder = CloudServant.builder()
        .restServiceModule({ name: 'Module1' });
      expect(() => {
        builder.messageModule({ name: 'Module1' });
      })
        .to
        .throw(Error);
    });

    it('should combine multiple modules into one', () => {
      let builder = CloudServant.builder()
        .restServiceModule({ name: 'Module1' })
        .messageModule({ name: 'Module2' });

      let module = builder.build();
      expect(module.Module1())
        .to
        .equal('MockRest: Module1');
      expect(module.Module2())
        .to
        .equal('MockMessage: Module2');
    });
  });

});
