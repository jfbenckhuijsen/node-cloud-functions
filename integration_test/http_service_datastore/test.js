const base64 = require('base-64');

module.exports = (it, expect, config) => {
  const auth_header = `Basic ${base64.encode('admin:welcome')}`;

  it('--> should add, update, get and remove Orders', (done) => {
    config.superagent.post(`${config.deploy_url}/orders`)
      .send({
        customerName: 'MyEnterprise',
        deliveryAddress: '1 CloudStreet, Sky city',
        invoiceAddress: '2 CloudStreet, Sky city',
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', auth_header)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res.ok)
          .to
          .equal(true);

        console.log('Order created');

        const orderId = res.text;
        expect(orderId).to.not.be.null;
        expect(orderId)
          .to
          .not
          .equal('');

        config.superagent.get(`${config.deploy_url}/orders/${orderId}`)
          .set('Content-Type', 'application/json')
          .set('Authorization', auth_header)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res.ok)
              .to
              .equal(true);

            console.log('Order retrieved');

            const order = res.body;
            expect(order.customerName)
              .to
              .be
              .equal('MyEnterprise');
            expect(order.deliveryAddress)
              .to
              .be
              .equal('1 CloudStreet, Sky city');
            expect(order.invoiceAddress)
              .to
              .be
              .equal('2 CloudStreet, Sky city');

            config.superagent.put(`${config.deploy_url}/orders/${orderId}`)
              .send({
                customerName: 'MyEnterprise',
                deliveryAddress: order.invoiceAddress,
                invoiceAddress: order.deliveryAddress,

              })
              .set('Content-Type', 'application/json')
              .set('Authorization', auth_header)
              .end((err, res) => {
                expect(err).to.be.null;
                expect(res.ok)
                  .to
                  .equal(true);

                console.log('Order updated');

                config.superagent.get(`${config.deploy_url}/orders`)
                  .set('Content-Type', 'application/json')
                  .set('Authorization', auth_header)
                  .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res.ok)
                      .to
                      .equal(true);

                    console.log('Orders queried');

                    const order = res.body.filter((o) => o.id === orderId)[0];

                    expect(order.customerName)
                      .to
                      .be
                      .equal('MyEnterprise');
                    expect(order.deliveryAddress)
                      .to
                      .be
                      .equal('2 CloudStreet, Sky city');
                    expect(order.invoiceAddress)
                      .to
                      .be
                      .equal('1 CloudStreet, Sky city');

                    config.superagent.delete(`${config.deploy_url}/orders/${orderId}`)
                      .set('Content-Type', 'application/json')
                      .set('Authorization', auth_header)
                      .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res.ok)
                          .to
                          .equal(true);

                        console.log('Orders deleted');

                        done();
                      });
                  });
              });
          });
      });
  });
};
