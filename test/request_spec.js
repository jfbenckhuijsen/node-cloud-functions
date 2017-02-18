"use strict";

var chai       = require('chai');
var sinon      = require('sinon');
var sinonChai  = require("sinon-chai");
chai.use(sinonChai);

var expect     = chai.expect;

var Boom       = require('Boom');
var Joi        = require('Joi');

describe("Requester", () => {

    var Request = require('../lib/request');

    function doRequest(body, schema, handler) {
        var res = {};

        res.status = sinon.stub().returns(res);
        res.send = sinon.spy();

        Request({
            body: body
        }, res, schema, handler);

        return res;
    }

    it("Should make a succesfull request", () => {
        var response = {test:"test"};
        var res = doRequest({}, undefined, (LOGGER, req, res, resultHandler) => {
            resultHandler(response, null);
        });
        expect(res.status).to.have.been.calledWith(200);
        expect(res.send).to.have.been.calledWith(response);
    });


    describe(" --> Error handling", () => {
        it("Should handle exceptions in the requestHandler", () => {
            var res = doRequest({}, undefined, (LOGGER, req, res, resultHandler) => {
                throw "some error";
            });
            expect(res.status).to.have.been.calledWith(500);
            expect(res.send).to.have.been.calledWith("\"some error\"");
        });

        it("Should handle normal error objects, resulting in HTTP 500", () => {
            var res = doRequest({}, undefined, (LOGGER, req, res, resultHandler) => {
                resultHandler(null, "some error");
            });
            expect(res.status.calledWith(500)).to.equal(true);
            expect(res.send).to.have.been.calledWith("\"some error\"");
        });

        it("Should accept Boom objects as errors", () => {
            var res = doRequest({}, undefined, (LOGGER, req, res, resultHandler) => {
                resultHandler(null, Boom.paymentRequired("I need some payment", { amount: "12 euro" }));
            });
            expect(res.status.calledWith(402)).to.equal(true);
            expect(res.send).to.have.been.calledWith({
                error: "Payment Required",
                message: "I need some payment",
                statusCode: 402
            });
        });
    });

    describe(" --> Schema validation", () => {
        it("Should succesfully validate the payload", () => {
            var response = {test:"test"};
            var res = doRequest({
                userName: "test@test.com"
            }, {
                userName : Joi.string().email().required(),
            }, (LOGGER, req, res, resultHandler) => {
                resultHandler(response, null);
            });
            expect(res.status).to.have.been.calledWith(200);
            expect(res.send).to.have.been.calledWith(response);
        });

        it("Should result in an error in case the payload doesn't match the schema", () => {
            var response = {test:"test"};
            var res = doRequest({
            }, {
                userName : Joi.string().email().required(),
            }, (LOGGER, req, res, resultHandler) => {
                resultHandler(response, null);
            });
            expect(res.status).to.have.been.calledWith(401);
            expect(res.send).to.have.been.calledWith([{message:"\"userName\" is required",path:"userName"}]);
        });
    });

});
