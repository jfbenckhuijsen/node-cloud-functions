"use strict";

const chai          = require('chai');
const sinon         = require('sinon');
const sinonChai     = require('sinon-chai');
const expect        = chai.expect;
const passport      = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const base64        = require('base-64');
const DebugLogger   = require('../lib/debug');
const status        = require('http-status');
const Joi           = require('@hapi/joi');
const DefaultError  = require('../lib/spi_plugins/default_errror');

chai.use(sinonChai);

passport.use(new BasicStrategy(
    function(username, password, done) {
        if (username === "admin" && password === "welcome") {
            return done(null, {
                user: "admin"
            });
        } else {
            return done(null, false);
        }
    }
));

describe('Path controller', () => {

    let PathController = require('../lib/path_controller');

    const OPTIONS = {
        paths: [
            /**
             * Regular paths
             */
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
                    res.status(status.OK).send(req.params);
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
                path: '/user/errorhandler',
                use: (req, res, next) => {
                    next(new Error("Some error has occurred"));
                },
                requestHandler: (req, res) => {

                }
            },
            /**
             * CORS support paths
             */
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
            /**
             * Authentication support paths
             */
            {
                method: 'OPTIONS',
                path: '/user/noncors/uniquemethod',
                cors: false,
                requestHandler: (req, res) => {
                    res.status(status.OK).end();
                }
            },
            {
                method: 'GET',
                path: '/user/authenticated',
                cors: false,
                auth: true,
                requestHandler: (req, res) => {
                    res.status(status.OK).end();
                }
            },
            /**
             * Schema validation support paths
             */
            {
                method: 'POST',
                path: '/user/schemavalidation',
                schema: {
                    userName : Joi.string().email().required(),
                },
                requestHandler: (req, res) => {
                    res.status(status.OK).end();
                }
            },
            /**
             * Caching headers support paths
             */
            {
                method: 'GET',
                path: '/user/caching/notreusable',
                cacheHeaders: {
                    cacheable: false
                },
                requestHandler: (req, res) => {
                    res.status(status.OK).end();
                }
            },
            {
                method: 'GET',
                path: '/user/caching/revalidate',
                cacheHeaders: {
                    cacheable: {
                        revalidate: true
                    }
                },
                requestHandler: (req, res) => {
                    res.status(status.OK).end();
                }
            },
            {
                method: 'GET',
                path: '/user/caching/public',
                cacheHeaders: {
                    cacheable: {
                        revalidate: false,
                        maxAge: "5min",
                        sharedCaches: true
                    }
                },
                requestHandler: (req, res) => {
                    res.status(status.OK).end();
                }
            },
            {
                method: 'GET',
                path: '/user/caching/private',
                cacheHeaders: {
                    cacheable: {
                        revalidate: false,
                        maxAge: "5min",
                        sharedCaches: false
                    }
                },
                requestHandler: (req, res) => {
                    res.status(status.OK).end();
                }
            },
            {
                method: 'GET',
                path: '/user/caching/shared_override',
                cacheHeaders: {
                    cacheable: {
                        revalidate: false,
                        maxAge: "5min",
                        sharedCaches: {
                            maxAge: "10min",
                            revalidate: false,
                            noTransform: true
                        }
                    }
                },
                requestHandler: (req, res) => {
                    res.status(status.OK).end();
                }
            },
            {
                method: 'GET',
                path: '/user/caching/stale',
                cacheHeaders: {
                    cacheable: {
                        revalidate: false,
                        maxAge: "5min",
                        stale: {
                            whileRevalidate: "2min 30sec",
                            ifError: "10min"
                        }
                    }
                },
                requestHandler: (req, res) => {
                    res.status(status.OK).end();
                }
            },
            {
                method: 'GET',
                path: '/user/caching/raw',
                cacheHeaders: {
                    raw: {
                        public: true,
                        mustRevalidate: true,
                        maxAge: 5
                    }
                },
                requestHandler: (req, res) => {
                    res.status(status.OK).end();
                }
            },
        ],
        authStrategies : {
            default: passport.authenticate('basic', {session: false})
        }
    };

    describe('--> toApiRequest', () => {
        it('should find the API based on a request with a unknown path', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let apiRequest = controller.toApiRequest({
                path: '/posts',
                method: 'GET'
            });

            expect(apiRequest).to.be.null;
        });

        it('should find the API based on a request with a unknown method', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let apiRequest = controller.toApiRequest({
                path: '/user',
                method: 'POST'
            });

            expect(apiRequest).to.be.null;
        });

        it('should find the API based on a request for the root path (empty string)', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let apiRequest = controller.toApiRequest({
                path: '',
                method: 'GET'
            });

            expect(apiRequest).to.not.be.null;
            expect(apiRequest.params).to.be.empty;
            expect(apiRequest.api).to.deep.equal({
                "requestHandler": OPTIONS.paths[0].requestHandler,
                "method": [
                    "GET"
                ],
                "path": "/",
                "schema": undefined,
                "use": [DefaultError.defaultErrorHandler]
            });
        });

        it('should find the API based on a request for the root path (null)', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let apiRequest = controller.toApiRequest({
                path: null,
                method: 'GET'
            });

            expect(apiRequest).to.not.be.null;
            expect(apiRequest.params).to.be.empty;
            expect(apiRequest.api).to.deep.equal({
                "requestHandler": OPTIONS.paths[0].requestHandler,
                "method": [
                    "GET"
                ],
                "path": "/",
                "schema": undefined,
                "use": [DefaultError.defaultErrorHandler]
            });
        });

        it('should find the API based on a request with a single level path', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let apiRequest = controller.toApiRequest({
                path: '/user',
                method: 'PUT'
            });

            expect(apiRequest).to.not.be.null;
            expect(apiRequest.params).to.be.empty;
            expect(apiRequest.api).to.deep.equal({
                "requestHandler": OPTIONS.paths[1].requestHandler,
                "method": [
                    "PUT"
                ],
                "path": "/user",
                "schema": undefined,
                "use": [DefaultError.defaultErrorHandler]
            });
        });

        it('should find the API based on a request with a multi level path', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let apiRequest = controller.toApiRequest({
                path: '/user/login',
                method: 'GET'
            });

            expect(apiRequest).to.not.be.null;
            expect(apiRequest.params).to.be.empty;
            expect(apiRequest.api).to.deep.equal({
                "requestHandler": OPTIONS.paths[2].requestHandler,
                "method": [
                    "GET"
                ],
                "path": "/user/login",
                "schema": undefined,
                "use": [DefaultError.defaultErrorHandler]
            });
        });

        it('should find the API based on a request with a duplicate', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            expect(() => {
                controller.toApiRequest({
                    path: '/user/duplicate',
                    method: 'GET'
                });
            }).to.throw(Error);
        });

        it('should find the API based on a request with a single parameter', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let apiRequest = controller.toApiRequest({
                path: '/user/12345',
                method: 'GET'
            });

            expect(apiRequest).to.not.be.null;
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
                "use": [DefaultError.defaultErrorHandler]
            });
        });

        it('should find the API based on a request with multiple parameters', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let apiRequest = controller.toApiRequest({
                path: '/user/12345/abcdef',
                method: 'POST'
            });

            expect(apiRequest).to.not.be.null;
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
                "use": [DefaultError.defaultErrorHandler]
            });
        });
    });

    describe('--> executeRequest', () => {
        it('should return status 404 in case the request cannot be found', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.status = sinon.stub().returns(res);
            res.send = sinon.spy();

            controller.executeRequest({
                path: '/posts',
                method: 'GET'
            }, res, null);


            expect(res.status).to.have.been.calledWith(status.NOT_FOUND);
            expect(res.send).to.have.been.called;
        });

        it('should call the handler on a request', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.status = sinon.stub().returns(res);
            res.send = sinon.stub();

            controller.executeRequest({
                path: '/user/12345/abcdef',
                method: 'POST'
            }, res, null);


            expect(res.status).to.have.been.calledWith(status.OK);
            expect(res.send).to.have.been.calledWithMatch({
                id : "12345",
                username: 'abcdef'
            });
        });

        it('should call the default error handler on middleware error', () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.status = sinon.stub().returns(res);
            res.send = sinon.stub();

            controller.executeRequest({
                path: '/user/errorhandler',
                method: 'GET'
            }, res, null);


            expect(res.status).to.have.been.calledWith(status.INTERNAL_SERVER_ERROR);
        });
    });

    describe('--> cors based requests', () => {
        it("should answer to a CORS options request", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

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

            expect(res.statusCode).to.equal(status.NO_CONTENT);
            expect(res.setHeader).to.have.been.calledWith('Access-Control-Allow-Origin', '*');
            expect(res.end).to.have.been.calledWith();
        });

        it("should add CORS headers to a regular request", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

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
            const controller = new PathController(OPTIONS, DebugLogger(true));

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

            expect(res.statusCode).to.equal(status.NO_CONTENT);
            expect(res.setHeader.calledWith('Access-Control-Allow-Origin', '*')).to.equal(true);
            expect(res.end.calledWith());
        });

        it("should handle non-cors OPTIONS requests to paths where only the method differs", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

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

            expect(res.status.calledWith(status.OK));
            expect(res.end.calledWith());
        });

        it("should handle cors requests when cors is globally enabled", () => {
            const controller = new PathController({
                cors: true,
                paths: [
                    /**
                     * CORS support paths
                     */
                    {
                        method: 'GET',
                        path: '/user/cors',
                        requestHandler: (req, res) => {
                        }
                    },
                    {
                        method: 'GET',
                        path: '/user/cors/uniquemethod',
                        requestHandler: (req, res) => {
                        }
                    },
                    {
                        method: 'POST',
                        path: '/user/cors/uniquemethod',
                        requestHandler: (req, res) => {
                        }
                    },
                    {
                        method: 'GET',
                        path: '/user/noncors/uniquemethod',
                        cors: false,
                        requestHandler: (req, res) => {
                        }
                    }
                ]
            }, DebugLogger(true));

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

            expect(res.statusCode).to.equal(status.NO_CONTENT);
            expect(res.setHeader.calledWith('Access-Control-Allow-Origin', '*')).to.equal(true);
            expect(res.end.calledWith());
        })

    });

    describe('--> authenticated requests', () => {
        it("should handle authentication - success", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();

            let http = require('http');
            let req = new http.IncomingMessage;
            req.path = '/user/authenticated';
            req.method = 'GET';
            req.headers = {
                authorization: "Basic " + base64.encode("admin:welcome")
            };

            controller.executeRequest(req, res, null);

            expect(res.status).calledWith(status.OK);
            expect(res.end).calledWith();
        });

        it("should handle authentication - failed", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();

            controller.executeRequest({
                path: '/user/authenticated',
                method: 'GET',
                headers : {
                    authorization: "Basic " + base64.encode("admin:notwelcome")
                }
            }, res, null);

            expect(res.statusCode).to.equal(status.UNAUTHORIZED);
            expect(res.end).calledWith("Unauthorized");
        });
    });

    describe('--> schema validation requests', () => {
        it("should handle schema validation - success", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();

            controller.executeRequest({
                path: '/user/schemavalidation',
                method: 'POST',
                body : {
                    userName: "a@b.com"

                }
            }, res, null);

            expect(res.status).calledWith(status.OK);
            expect(res.end).calledWith();
        });

        it("should handle schema validation - failure", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.send = sinon.stub();

            controller.executeRequest({
                path: '/user/schemavalidation',
                method: 'POST',
                body : {
                    userName: "some_invalid username"

                }
            }, res, null);

            expect(res.status).calledWith(status.BAD_REQUEST);
        });

    });

    describe('--> caching headers request', () => {
        it("should handle non-cacheable data", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();
            res.writeHead = sinon.stub();

            controller.executeRequest({
                path: '/user/caching/notreusable',
                method: 'GET'
            }, res, null);

            res.writeHead();

            expect(res.status).calledWith(status.OK);
            expect(res.end).calledWith();
            expect(res.setHeader).calledWith('Cache-Control', 'no-store,no-cache,max-age=0');
        });


        it("should handle revalidation of data", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();
            res.writeHead = sinon.stub();

            controller.executeRequest({
                path: '/user/caching/revalidate',
                method: 'GET'
            }, res, null);

            res.writeHead();

            expect(res.status).calledWith(status.OK);
            expect(res.end).calledWith();
            expect(res.setHeader).calledWith('Cache-Control', 'private,no-cache,max-age=0');
        });

        it("should handle data visible for public proxies", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();
            res.writeHead = sinon.stub();

            controller.executeRequest({
                path: '/user/caching/public',
                method: 'GET'
            }, res, null);

            res.writeHead();

            expect(res.status).calledWith(status.OK);
            expect(res.end).calledWith();
            expect(res.setHeader).calledWith('Cache-Control', 'public,max-age=300');
        });

        it("should handle cache private to the end user", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();
            res.writeHead = sinon.stub();

            controller.executeRequest({
                path: '/user/caching/private',
                method: 'GET'
            }, res, null);

            res.writeHead();

            expect(res.status).calledWith(status.OK);
            expect(res.end).calledWith();
            expect(res.setHeader).calledWith('Cache-Control', 'private,max-age=300');
        });

        it("should handle override for shared data", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();
            res.writeHead = sinon.stub();

            controller.executeRequest({
                path: '/user/caching/shared_override',
                method: 'GET'
            }, res, null);

            res.writeHead();

            expect(res.status).calledWith(status.OK);
            expect(res.end).calledWith();
            expect(res.setHeader).calledWith('Cache-Control', 'public,no-transform,max-age=300,s-maxage=600');
        });

        it("should handle settings for stale data", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();
            res.writeHead = sinon.stub();

            controller.executeRequest({
                path: '/user/caching/stale',
                method: 'GET'
            }, res, null);

            res.writeHead();

            expect(res.status).calledWith(status.OK);
            expect(res.end).calledWith();
            expect(res.setHeader).calledWith('Cache-Control', 'private,stale-if-error=600,stale-while-revalidate=150,max-age=300');
        });

        it("should handle raw settings", () => {
            const controller = new PathController(OPTIONS, DebugLogger(true));

            let res = {};

            res.setHeader = sinon.stub();
            res.getHeader = sinon.stub();
            res.status = sinon.stub().returns(res);
            res.end = sinon.stub();
            res.writeHead = sinon.stub();

            controller.executeRequest({
                path: '/user/caching/raw',
                method: 'GET'
            }, res, null);

            res.writeHead();

            expect(res.status).calledWith(status.OK);
            expect(res.end).calledWith();
            expect(res.setHeader).calledWith('Cache-Control', 'public,must-revalidate,max-age=5');
        });
    });
});
