"use strict";

var chai       = require('chai');
var sinon      = require('sinon');
var sinonChai  = require("sinon-chai");
var expect     = chai.expect;

describe('Path controller', () => {

    var PathController = require('../lib/path_controller');

    const OPTIONS = {
        paths: [
            {
                method: 'GET',
                path: '/',
                requestHandler: (req, res) => {

                }
            },
            {
                method: 'PUT',
                path: '/user',
                requestHandler: (req, res) => {

                }
            },
            {
                method: 'GET',
                path: '/user/login',
                requestHandler: (req, res) => {

                }
            },
            {
                method: 'POST',
                path: '/user/login',
                requestHandler: (req, res) => {

                }
            },
            {
                method: 'GET',
                path: '/user/{id}',
                requestHandler: (req, res) => {

                }
            },
            {
                method: 'POST',
                path: '/user/{id}',
                requestHandler: (req, res) => {

                }
            },
            {
                method: 'POST',
                path: '/user/{id}/{username}',
                requestHandler: (req, res) => {
                    res.status(200).send(req.params);
                }
            },
            {
                method: 'GET',
                path: '/user/duplicate',
                requestHandler: (req, res) => {

                }
            },
            {
                method: 'GET',
                path: '/user/duplicate',
                requestHandler: (req, res) => {

                }
            },
            {
                method: 'GET',
                path: '/user/cors',
                cors: true,
                requestHandler: (req, res) => {
                }
            },
            {
                method: 'GET',
                path: '/user/cors/uniquemethod',
                cors: true,
                requestHandler: (req, res) => {
                }
            },
            {
                method: 'POST',
                path: '/user/cors/uniquemethod',
                cors: true,
                requestHandler: (req, res) => {
                }
            },
            {
                method: 'GET',
                path: '/user/noncors/uniquemethod',
                cors: false,
                requestHandler: (req, res) => {
                }
            },
            {
                method: 'OPTIONS',
                path: '/user/noncors/uniquemethod',
                cors: false,
                requestHandler: (req, res) => {
                    res.status(200).end();
                }
            }

        ]
    };

    describe('--> toApiRequest', () => {
        it('should find the API based on a request with a unknown path', () => {
            const controller = new PathController(OPTIONS);

            let apiRequest = controller.toApiRequest({
                path: '/posts',
                method: 'GET'
            });

            expect(apiRequest).to.be.null
        });

        it('should find the API based on a request with a unknown method', () => {
            const controller = new PathController(OPTIONS);

            let apiRequest = controller.toApiRequest({
                path: '/user',
                method: 'POST'
            });

            expect(apiRequest).to.be.null
        });

        it('should find the API based on a request for the root path (empty string)', () => {
            const controller = new PathController(OPTIONS);

            let apiRequest = controller.toApiRequest({
                path: '',
                method: 'GET'
            });

            expect(apiRequest).to.not.be.null
            expect(apiRequest.params).to.be.empty;
            expect(apiRequest.api).to.deep.equal({
                "requestHandler": OPTIONS.paths[0].requestHandler,
                "method": [
                    "GET"
                ],
                "path": "/",
                "schema": undefined,
                "use": [controller.defaultErrorHandler],
                cors: undefined
            });
        });

        it('should find the API based on a request for the root path (null)', () => {
            const controller = new PathController(OPTIONS);

            let apiRequest = controller.toApiRequest({
                path: null,
                method: 'GET'
            });

            expect(apiRequest).to.not.be.null
            expect(apiRequest.params).to.be.empty;
            expect(apiRequest.api).to.deep.equal({
                "requestHandler": OPTIONS.paths[0].requestHandler,
                "method": [
                    "GET"
                ],
                "path": "/",
                "schema": undefined,
                "use": [controller.defaultErrorHandler],
                cors: undefined
            });
        });

        it('should find the API based on a request with a single level path', () => {
            const controller = new PathController(OPTIONS);

            let apiRequest = controller.toApiRequest({
                path: '/user',
                method: 'PUT'
            });

            expect(apiRequest).to.not.be.null
            expect(apiRequest.params).to.be.empty;
            expect(apiRequest.api).to.deep.equal({
                "requestHandler": OPTIONS.paths[1].requestHandler,
                "method": [
                    "PUT"
                ],
                "path": "/user",
                "schema": undefined,
                "use": [controller.defaultErrorHandler],
                cors: undefined
            });
        });

        it('should find the API based on a request with a multi level path', () => {
            const controller = new PathController(OPTIONS);

            let apiRequest = controller.toApiRequest({
                path: '/user/login',
                method: 'GET'
            });

            expect(apiRequest).to.not.be.null
            expect(apiRequest.params).to.be.empty;
            expect(apiRequest.api).to.deep.equal({
                "requestHandler": OPTIONS.paths[2].requestHandler,
                "method": [
                    "GET"
                ],
                "path": "/user/login",
                "schema": undefined,
                "use": [controller.defaultErrorHandler],
                cors: undefined
            });
        });

        it('should find the API based on a request with a duplicate', () => {
            const controller = new PathController(OPTIONS);

            expect(() => {
                let apiRequest = controller.toApiRequest({
                    path: '/user/duplicate',
                    method: 'GET'
                });
            }).to.throw(Error);
        });

        it('should find the API based on a request with a single parameter', () => {
            const controller = new PathController(OPTIONS);

            let apiRequest = controller.toApiRequest({
                path: '/user/12345',
                method: 'GET'
            });

            expect(apiRequest).to.not.be.null
            expect(apiRequest.params).to.deep.equal({
                id: '12345'
            });
            expect(apiRequest.api).to.deep.equal({
                "requestHandler": OPTIONS.paths[4].requestHandler,
                "method": [
                    "GET"
                ],
                "path": "/user/{id}",
                "schema": undefined,
                "use": [controller.defaultErrorHandler],
                cors: undefined
            });
        });

        it('should find the API based on a request with multiple parameters', () => {
            const controller = new PathController(OPTIONS);

            let apiRequest = controller.toApiRequest({
                path: '/user/12345/abcdef',
                method: 'POST'
            });

            expect(apiRequest).to.not.be.null
            expect(apiRequest.params).to.deep.equal({
                id: '12345',
                username: 'abcdef'
            });
            expect(apiRequest.api).to.deep.equal({
                "requestHandler": OPTIONS.paths[6].requestHandler,
                "method": [
                    "POST"
                ],
                "path": "/user/{id}/{username}",
                "schema": undefined,
                "use": [controller.defaultErrorHandler],
                cors: undefined
            });
        });
    });

    describe('--> executeRequest', () => {
        it('should return status 404 in case the request cannot be found', () => {
            const controller = new PathController(OPTIONS);

            let res = {};

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
            const controller = new PathController(OPTIONS);

            let res = {};

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

    describe('--> cors based requests', () => {
        it("should answer to a CORS options request", () => {
            const controller = new PathController(OPTIONS);

            let res = {};

            res.setHeader = sinon.stub().returns(res);
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();

            controller.executeRequest({
                path: '/user/cors',
                method: 'OPTIONS',
                headers : {
                    origin : 'http://localhost:8080',
                    'access-control-request-method': 'GET'
                }
            }, res, null);

            expect(res.statusCode).to.equal(204);
            expect(res.setHeader.calledWith('Access-Control-Allow-Origin', '*')).to.equal(true);
            expect(res.end.calledWith());
        });

        it("should add CORS headers to a regular request", () => {
            const controller = new PathController(OPTIONS);

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);

            controller.executeRequest({
                path: '/user/cors',
                method: 'GET',
                headers : {
                    origin : 'http://localhost:8080'
                }
            }, res, null);

            expect(res.setHeader.calledWith('Access-Control-Allow-Origin', '*')).to.equal(true);
        });

        it("should handle cors OPTIONS requests to paths where only the method differs", () => {
            const controller = new PathController(OPTIONS);

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();

            controller.executeRequest({
                path: '/user/cors/uniquemethod',
                method: 'OPTIONS',
                headers : {
                    origin : 'http://localhost:8080',
                    'access-control-request-method': 'GET'
                }
            }, res, null);

            expect(res.statusCode).to.equal(204);
            expect(res.setHeader.calledWith('Access-Control-Allow-Origin', '*')).to.equal(true);
            expect(res.end.calledWith());
        });

        it("should handle non-cors OPTIONS requests to paths where only the method differs", () => {
            const controller = new PathController(OPTIONS);

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();

            controller.executeRequest({
                path: '/user/noncors/uniquemethod',
                method: 'OPTIONS',
                headers : {
                    origin : 'http://localhost:8080'
                }
            }, res, null);

            expect(res.status.calledWith(200));
            expect(res.end.calledWith());
        })

    });

    // TODO: Add test for default error handler
    // TODO: Add test for auth
});