"use strict";

const base64        = require('base-64');
const status        = require('http-status');

module.exports = (it, superagent, expect, config) => {

    const auth_header = 'Basic ' + base64.encode("admin:welcome");

    it("--> should add, update, get and remove Orders", (done) => {
        superagent.post(config.deploy_url + '/orders')
            .send({
                customerName: "MyEnterprise",
                deliveryAddress: "1 CloudStreet, Sky city",
                invoiceAddress: "2 CloudStreet, Sky city"
            })
            .set('Content-Type', 'application/json')
            .set('Authorization', auth_header)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res.ok).to.equal(true);

                console.log("Order created");

                let orderId = res.text;
                expect(orderId).to.not.be.null;
                expect(orderId).to.not.equal("");

                superagent.get(config.deploy_url + '/orders/' + orderId)
                    .set('Content-Type', 'application/json')
                    .set('Authorization', auth_header)
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res.ok).to.equal(true);

                        console.log("Order retrieved");

                        let order = res.body;
                        expect(order.customerName).to.be.equal("MyEnterprise");
                        expect(order.deliveryAddress).to.be.equal("1 CloudStreet, Sky city");
                        expect(order.invoiceAddress).to.be.equal("2 CloudStreet, Sky city");

                        superagent.put(config.deploy_url + '/orders/' + orderId)
                            .send({
                                customerName: "MyEnterprise",
                                deliveryAddress: order.invoiceAddress,
                                invoiceAddress: order.deliveryAddress

                            })
                            .set('Content-Type', 'application/json')
                            .set('Authorization', auth_header)
                            .end((err, res) => {
                                expect(err).to.be.null;
                                expect(res.ok).to.equal(true);

                                console.log("Order updated");

                                superagent.get(config.deploy_url + '/orders')
                                    .set('Content-Type', 'application/json')
                                    .set('Authorization', auth_header)
                                    .end((err, res) => {
                                        expect(err).to.be.null;
                                        expect(res.ok).to.equal(true);

                                        console.log("Orders queried");

                                        let order = res.body.filter((order) => order.id === orderId)[0];

                                        expect(order.customerName).to.be.equal("MyEnterprise");
                                        expect(order.deliveryAddress).to.be.equal("2 CloudStreet, Sky city");
                                        expect(order.invoiceAddress).to.be.equal("1 CloudStreet, Sky city");

                                        superagent.delete(config.deploy_url + '/orders/' + orderId)
                                            .set('Content-Type', 'application/json')
                                            .set('Authorization', auth_header)
                                            .end((err, res) => {
                                                expect(err).to.be.null;
                                                expect(res.ok).to.equal(true);

                                                console.log("Orders deleted");

                                                done();
                                            });
                                    });

                            });
                    });
            });
    });

};
