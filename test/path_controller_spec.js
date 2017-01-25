"use strict";

var chai       = require('chai');
var sinon      = require('sinon');
var expect     = chai.expect;

// TODO: CORS requests

describe('Path controller', () => {

    var PathController = require('../lib/path_controller');

    const OPTIONS = {
        paths: [
            {
                method: 'PUT',
                path: '/user',
                auth: false,
                handler: function(req, res) {

                }
            },
            {
                method: 'GET',
                path: '/user/login',
                auth: false,
                handler: function(req, res) {

                }
            },
            {
                method: 'POST',
                path: '/user/login',
                auth: false,
                handler: function(req, res) {

                }
            },
            {
                method: 'GET',
                path: '/user/{id}',
                auth: true,
                handler: function(req, res) {

                }
            },
            {
                method: 'POST',
                path: '/user/{id}/{username}',
                auth: false,
                handler: function(req, res) {
                    res.status(200).send(req.params);
                }
            },
            {
                method: 'GET',
                path: '/user/duplicate',
                auth: false,
                handler: function(req, res) {

                }
            },
            {
                method: 'GET',
                path: '/user/duplicate',
                auth: false,
                handler: function(req, res) {

                }
            },

        ]
    };

    describe('--> toApiRequest', () => {
        it('should find the API based on a request with a unknown path', () => {
            var controller = new PathController(OPTIONS);

            var apiRequest = controller.toApiRequest({
                path: '/posts',
                method: 'GET'
            });

            expect(apiRequest).to.be.null
        });

        it('should find the API based on a request with a unknown method', () => {
            var controller = new PathController(OPTIONS);

            var apiRequest = controller.toApiRequest({
                path: '/user',
                method: 'POST'
            });

            expect(apiRequest).to.be.null
        });

        it('should find the API based on a request with a single level path', () => {
            var controller = new PathController(OPTIONS);

            var apiRequest = controller.toApiRequest({
                path: '/user',
                method: 'PUT'
            });

            expect(apiRequest).to.not.be.null
            expect(apiRequest.params).to.be.empty;
            expect(apiRequest.api).to.deep.equal(OPTIONS.paths[0]);
        });

        it('should find the API based on a request with a multi level path', () => {
            var controller = new PathController(OPTIONS);

            var apiRequest = controller.toApiRequest({
                path: '/user/login',
                method: 'GET'
            });

            expect(apiRequest).to.not.be.null
            expect(apiRequest.params).to.be.empty;
            expect(apiRequest.api).to.deep.equal(OPTIONS.paths[1]);
        });

        it('should find the API based on a request with a duplicate', () => {
            var controller = new PathController(OPTIONS);

            expect(() => {
                var apiRequest = controller.toApiRequest({
                    path: '/user/duplicate',
                    method: 'GET'
                });
            }).to.throw(Error);
        });

        it('should find the API based on a request with a single parameter', () => {
            var controller = new PathController(OPTIONS);

            var apiRequest = controller.toApiRequest({
                path: '/user/12345',
                method: 'GET'
            });

            expect(apiRequest).to.not.be.null
            expect(apiRequest.params).to.deep.equal({
                id: '12345'
            });
            expect(apiRequest.api).to.deep.equal(OPTIONS.paths[3]);
        });

        it('should find the API based on a request with multiple parameters', () => {
            var controller = new PathController(OPTIONS);

            var apiRequest = controller.toApiRequest({
                path: '/user/12345/abcdef',
                method: 'POST'
            });

            expect(apiRequest).to.not.be.null
            expect(apiRequest.params).to.deep.equal({
                id: '12345',
                username: 'abcdef'
            });
            expect(apiRequest.api).to.deep.equal(OPTIONS.paths[4]);
        });
    });

    describe('--> executeRequest', () => {
        it('should return status 404 in case the request cannot be found', () => {
            var controller = new PathController(OPTIONS);

            var res = {};

            res.status = sinon.stub().returns(res);
            res.send = sinon.spy();

            controller.executeRequest({
                path: '/posts',
                method: 'GET'
            }, res, null);


            expect(res.status.calledWith(404)).to.equal(true);
            expect(res.send.called).to.equal(true);
        });

        it('should call the handler on an unauthenticated request', () => {
            var controller = new PathController(OPTIONS);

            var res = {};

            res.status = sinon.stub().returns(res);
            res.send = sinon.stub();

            controller.executeRequest({
                path: '/user/12345/abcdef',
                method: 'POST'
            }, res, null);


            expect(res.status.calledWith(200)).to.equal(true);
            expect(res.send.calledWithMatch({
                id : "12345",
                username: 'abcdef'
            })).to.equal(true);
        });
    });
});