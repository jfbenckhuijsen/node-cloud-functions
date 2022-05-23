'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const expect = chai.expect;
const status = require('http-status');

const Boom = require('@hapi/boom');

describe('Requester', () => {

  const Request = require('../lib/request');

  function doRequest(body, handler) {
    const res = {};

    res.status = sinon.stub()
      .returns(res);
    res.send = sinon.spy();

    Request({
      body: body
    }, res, handler);

    return res;
  }

  it('Should make a succesfull request', () => {
    const response = { test: 'test' };
    const res = doRequest({}, (LOGGER, req, res, resultHandler) => {
      resultHandler(response, null);
    });
    expect(res.status)
      .to
      .have
      .been
      .calledWith(status.OK);
    expect(res.send)
      .to
      .have
      .been
      .calledWith(response);
  });

  describe(' --> Error handling', () => {
    it('Should handle exceptions in the requestHandler', () => {
      const res = doRequest({}, (LOGGER, req, res, resultHandler) => {
        throw 'some error';
      });
      expect(res.status)
        .to
        .have
        .been
        .calledWith(status.INTERNAL_SERVER_ERROR);
      expect(res.send)
        .to
        .have
        .been
        .calledWith('{"message":"some error"}');
    });

    it('Should handle normal error objects, resulting in HTTP 500', () => {
      const res = doRequest({}, (LOGGER, req, res, resultHandler) => {
        resultHandler(null, 'some error');
      });
      expect(res.status.calledWith(status.INTERNAL_SERVER_ERROR))
        .to
        .equal(true);
      expect(res.send)
        .to
        .have
        .been
        .calledWith('{"message":"some error"}');
    });

    it('Should accept Boom objects as errors', () => {
      const res = doRequest({}, (LOGGER, req, res, resultHandler) => {
        resultHandler(null, Boom.paymentRequired('I need some payment', { amount: '12 euro' }));
      });
      expect(res.status.calledWith(status.PAYMENT_REQUIRED))
        .to
        .equal(true);
      expect(res.send)
        .to
        .have
        .been
        .calledWith({
          error: 'Payment Required',
          message: 'I need some payment',
          statusCode: status.PAYMENT_REQUIRED
        });
    });
  });

});
