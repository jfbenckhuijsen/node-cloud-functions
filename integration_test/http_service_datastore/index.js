"use strict";

const CloudServant = require('cloud-servant')(__dirname + '/config.json', '');
const gstore = require('gstore-node');
const Schema = gstore.Schema;
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const Joi = require('joi');
const status = require('http-status');

passport.use(new BasicStrategy(
    function(username, password, done) {
        if (username == "admin" && password == "welcome") {
            return done(null, {
                user: "admin"
            });
        } else {
            return done(null, false);
        }
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

const OrderSchema = new Schema({
    orderDate: {type: 'datetime', required: true},
    customerName: {type: 'string', required: true},
    deliveryAddress: {type: 'string', required: true},
    invoiceAddress: {type: 'string', required: true}
});
const Order = CloudServant.db.gstore.model("Order", OrderSchema);

module.exports = CloudServant.restServiceModule({
    name: 'http-service-datastore',
    cors: true,
    authStrategies : {
        default: passport.authenticate('basic', {session: false})
    },
    paths : [
        {
            method: "POST",
            path: "/orders",
            auth: true,
            schema: {
                customerName: Joi.string().required(),
                deliveryAddress: Joi.string().required(),
                invoiceAddress: Joi.string().required()
            },
            handler: (LOGGER, req, res) => {
                new Order({
                    orderDate: new Date(),
                    customerName : req.body.customerName,
                    deliveryAddress : req.body.deliveryAddress,
                    invoiceAddress : req.body.invoiceAddress
                }).save()
                    .then((aanmelding) => res.status(status.CREATED).send(aanmelding.entityKey.id))
                    .catch((err) => res.handle(err));
            }
        },
        {
            method: "PUT",
            path: "/orders/{id}",
            auth: true,
            schema: {
                customerName: Joi.string().required(),
                deliveryAddress: Joi.string().required(),
                invoiceAddress: Joi.string().required()
            },
            handler: (LOGGER, req, res) => {
                console.log(req.params.id);
                Order.get(req.params.id)
                    .then((order) => {
                        order.customerName = req.body.customerName;
                        order.deliveryAddress = req.body.deliveryAddress;
                        order.invoiceAddress = req.body.invoiceAddress;
                        order.save()
                            .then((order) => res.status(status.OK).end())
                            .catch((err) => res.handle(err));
                    })
                    .catch((err) => res.handle(err));
            }
        },
        {
            method: "GET",
            path: "/orders/{id}",
            auth: true,
            handler: (LOGGER, req, res) => {
                Order.get(req.params.id)
                    .then(entity => res.handle(entity.plain()))
                    .catch(err => res.handle(err));
            }
        },
        {
            method: "GET",
            path: "/orders",
            auth: true,
            handler: (LOGGER, req, res) => {
                let query = Order.query();
                if (req.query.customerName) {
                    query = query.filter("customerName", "=", req.query.customerName);
                }

                query.run()
                    .then((response) => res.handle(response.entities))
                    .catch((err) => res.handle(err));
            }
        },
        {
            method: "DELETE",
            path: "/orders/{id}",
            auth: true,
            handler: (LOGGER, req, res) => {
                Order.delete(req.params.id)
                    .then((response) => res.status(response.success ? status.NO_CONTENT : status.NOT_FOUND).send())
                    .catch((err) => res.handle(err));
            }
        }
    ]
});
