"use strict";

const chai       = require('chai');
const sinon      = require('sinon');
const sinonChai  = require("sinon-chai");
chai.use(sinonChai);

const expect     = chai.expect;

const Boom       = require('Boom');
const Joi        = require('Joi');

describe("Requester", () => {

    const Request = require('../lib/request');

    function doRequest(body, schema, handler) {
        const res = {};

        res.status = sinon.stub().returns(res);
        res.send = sinon.spy();

        Request({
            body: body
        }, res, schema, handler);

        return res;
    }

    it("Should make a succesfull request", () => {
        const response = {test:"test"};
        const res = doRequest({}, undefined, (LOGGER, req, res, resultHandler) => {
            resultHandler(response, null);
        });
        expect(res.status).to.have.been.calledWith(200);
        expect(res.send).to.have.been.calledWith(response);
    });


    describe(" --> Error handling", () => {
        it("Should handle exceptions in the requestHandler", () => {
            const res = doRequest({}, undefined, (LOGGER, req, res, resultHandler) => {
                throw "some error";
            });
            expect(res.status).to.have.been.calledWith(500);
            expect(res.send).to.have.been.calledWith("{\"message\":\"some error\"}");
        });

        it("Should handle normal error objects, resulting in HTTP 500", () => {
            const res = doRequest({}, undefined, (LOGGER, req, res, resultHandler) => {
                resultHandler(null, "some error");
            });
            expect(res.status.calledWith(500)).to.equal(true);
            expect(res.send).to.have.been.calledWith("{\"message\":\"some error\"}");
        });

        it("Should accept Boom objects as errors", () => {
            const res = doRequest({}, undefined, (LOGGER, req, res, resultHandler) => {
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
            const response = {test:"test"};
            const res = doRequest({
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
            const response = {test:"test"};
            const res = doRequest({
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
