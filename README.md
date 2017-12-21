# CloudServant NodeJS MicroServices Framework

>_***Note: this framework is currently work in progress. The API may change at any time. Current support is mainly focussed 
 on Google Cloud Functions. Full support for AWS is lacking for now.***_

CloudServant is a framework aimed to allow to easily write functions running on one 
of the well known Cloud platforms:
 - Google Cloud Functions (including Firebase)
 - Amazon AWS Lamba
 - Microsoft Azure (currently not supported)
 
Each of these platforms have their own interfaces to which a service must comply and set 
of backend services which can be interacted with (like databases or messaging platforms). The
aim of the CloudServant framework is to bridge these differences and provide developers
with a unified framework to develop for each of these platforms as much as possible.

This framework was created based on some early experiments with these platforms and the 
effort involved to rewrite an application originally created for AWS Lamba to Google Cloud 
Functions.

The framework is inspired feature-wise by [Hapi.js](https://hapijs.com/), so you'll see quite some of
the internal frameworks of Hapi being used.

## General Features

This framework provides the following features:
- Definition of service modules
- Definition of message modules
- Abstraction of default databases provided by the Cloud provider
- Module configuration based on [Confluence](https://github.com/hapijs/confidence)
- Often used features for REST based services.

## Service Definition
The general way to define a service is to specify the interface and logic of the service and
let the framework generate a module definition based on that definition for the specific
runtime platform you're aiming at:

```js
const CloudServant = require('cloud-servant')(configFile, configTreePath);

module.exports = CloudServant.restServiceModule({
    // Specification of the service 
});
```

The configFile is a JSON based file which can be read by the [Confluence](https://github.com/hapijs/confidence) package. It is 
used to configure CloudServant itself and provide a generic infrastructure to pass 
 values to your service. The format of the config file is detailed below.

Two types of service modules can be created:
- REST Service modules (as shown in the example above)
- Backend Service modules

REST service modules provide a REST based API often to be consumed by clients of your 
API/MicroService. Backend Service modules provide internal logic to be called by REST Service
modules, other Backend Service modules or by other triggers (e.g. file uploads, backend 
processes, etc.). Backend Service modules are triggered in an asynchronous manner by their
callers.

#### General API of the CloudServant API object

The CloudServant object has the following API:

| Field | Explanation |
|-------|-------------|
| restServiceModule | Method to create a REST service module |
| messageModule | Method to create a Message service module |
| builder | Method to combine multiple types of modules into a single file |
| pluginOptions | Method to retrieve options from the configuration file for a specific path | 
| db | Object representing a connection to the DB object of the underlying Cloud platform, if configured. This is either a connection to [gstore-node](https://github.com/sebelga/gstore-node) or [Dynamoose](https://github.com/automategreen/dynamoose)| 


> Note: cloud-servant comes with a command line tool (cloud-servant) to generate an initial skeleton of an application.
 the tool to see the various command line arguments.
 
### Configuration file format

The format of the configuration file is as follows:

| Field    | Explanation                                                                      |
|----------|----------------------------------------------------------------------------------|
| platform | Either "GCF", "Firebase" or "AWS" to run your module on Google Cloud Functions, Firebase or AWS Lambda |
| googleDatastore | (GCF/Firebase Specific) Specifies the configuration for google data store and [gstore-node](https://github.com/sebelga/gstore-node)|
|          |                                                                                  |

#### Logging support

To provide transparent support for logging, a LOGGER object is provided to each call handler methods. This object has a 
number of functions as fields, which support logging at various levels:

| Method | Explanation |
|--------|-------------|
| debug  | Logs messages with debug level severity, used for debugging the application |
| info   | Logs messages with info level severity, used for normal flows |
| warning| Logs messages with warning level severity, used for strange but non-fatal application behavior |
| error  | Logs messages with error level severity, used for application errors |

TODO:There is currently no way to limit the level of log messages which get passed thru.

#### Google Datastore support

In case the `googleDatastore` object is specifed in the configuration, a Google DataStore and [gstore-node](https://github.com/sebelga/gstore-node) 
object is defined. The CloudServant object then has a field `db` as follows:
 
```js
{
   db : {
       gstore : 'GStore-node object'
   }
}
```

## Modules and Builder support

CloudServant allows various types of modules to be created, each of which will be detailed in the following paragraphs. 

Apart from the individual modules, CloudServant supports a builder to define multiple modules (of various types) in the
same file. This allows for convenient grouping of functionally related functions.

The builder is invoked by calling the `builder()` method on CloudServant. A fluent API can be used to define the various 
modules:

```js
module.exports = CloudServant.builder()
    .restServiceModule(/* REST configuration */)
    .messageModule(/* Message configuration */)
    .build();
``` 

Note that each of the modules needs to be configured with a unique name, specified in the name field in the configuration
options object. Initialization will fail if duplicate names are detected.

## REST Service Modules

REST Service modules are defined by called the `restServiceModule()` function on the CloudServant API Object. The
method takes an options object specifying the definition of the service module:

```js
const CloudServant = require('cloud-servant')(configFile, configTreePath);

module.exports = CloudServant.restServiceModule({
    name: 'REQUIRED: Name of the service module',
    use: "Array of Express/Connect compatbile middleware executed on all paths (see Middleware support below)",
    cors: 'Boolean: enables support for CORS on all paths. See CORS support',
    debug: 'Boolean: enables a specific path /_paths to show the set of configured paths and debugging logging of the framework',
    authStrategies: { // Optional, enables authentication
        default: passport.authenticate() // The default passport strategy to use
        [other name]: passport.authenticate() // Alternative strategies
    },
    auth: false,//'Boolean' or 'String': enables or disables global authentication. In case of a boolean, this refers to the default
     // authentication strategy. In case of a string, this refers to the name of the strategy.
    paths : [
        // Specification of the various paths
        {
            // Required definition
            method: "Either a string of the HTTP Verb name or an array of Verb names",
            path: "",
            handler : function(LOGGER, req, res, responseCallback) {
                // LOGGER is an instance of the generic Logging class
                // req is the base Express.js compatible Request object
                // res is the base Express.js compatible Response object
                // responseCallback is a function(result, err). result is send using HTTP 200, in case err !== undefined,
                //                  and err is a Boom object, this is used to return the results, else a HTTP 500 is used
                //                  and err is JSON.stringified as response payload. The same can be achieved using 
                //                  res.handle().
            },
            
            // Extended options
            use: ["Array of Connect/ExpressJS compatible middleware functions, see Middleware support"],
            cors: "Whether to enable or disable CORS for this path. See CORS support",
            schema: "Validation of JSON based payloads. See Payload validation",
            auth: false //'Boolean' or 'String': enables or disables global authentication. In case of a boolean, this refers to the default
                 // authentication strategy. In case of a string, this refers to the name of the strategy.

        }
    ]
});
```

#### Specifying paths and methods

The basic configuration needed for a REST service module is to specify the paths and the methods (HTTP verbs) which should
be handled by the REST service. This configuration is done by passing a configuration object to the `restServiceModule()`
function, which has a paths field in the configuration object, as can been seen above.

The paths field should contain an array of Path objects, each specifying a method/path combination which should be handled
by the service. There are three required parts of this definition:
* `method`: Specifying a single HTTP Verb name (uppercase) or an array of names
* `path`: Specifying the path. The path can be specified using 
* `handler`: a function taking 4 arguments:
  * LOGGER: A logging object to support logging messages. See [Logging Support]()
  * req: the base Express.js compatible Request object.
  * res: the base Express.js compatbile Response object
  * responseCallback: a function (result, err), which can be called to automatically send the result.

#### Error handling support

Errors occuring within the calls to the handler method are automatically handled. This can be done in a number of ways:
* Exceptions thrown from the handler method are send back to the client as an HTTP Error 500, with the stringified Error object as payload
* The responseCallback method can be called with an object as its second paramater:
    * In case this object is a [Boom](https://github.com/hapijs/boom) object, this is used to send the correct HTTP response to the client
    * In all other cases, a HTTP 500 is send to the client as an HTTP Error 500, with the stringified Error object as payload

#### Connect Middleware support

CloudServant has support for Express/Connect based middleware. Middleware can be configured at top level for
 all paths or overridden on a per-path basis as detailed above. 
 
Given the extended configuration needed and the fact that this type of middleware is often used in various services
CloudServant has support for the following standard middleware:
* CORS using [Node cors](https://github.com/expressjs/cors).
* Authentication using [Passport](http://passportjs.org/)

> Note: Not all available middleware has been tested, so you may run into bugs. In this case, feel free to file a bug.

#### CORS Support

The framework has support for [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) by default and can be 
enabled for various paths or globally. To enable CORS support globally, use the `cors: true` setting at the toplevel
path specification. Per path this can be overridden using the `cors: boolean` setting.

Whenever CORS is enabled, the framework will automatically:
* Enable [Node cors](https://github.com/expressjs/cors) as middleware
* Take CORS into account for path resolution in case there are multiple paths which differ by HTTP method only based on 
the HTTP Header `"access-control-request-method"`

#### Payload validation

For JSON based requests, the payload can automatically be validated to conform to a specific schema. This 
can be specified by setting the `schema` configuration parameter as an object with the expected keys. This 
object is automatically wrapped in a `Joi.object().keys()` for validation: 

```js

    paths : [
        {
            path: '',
            method: '',
            handler: () => {},//...
            
            schema: {
                userName : Joi.string().email().required(),
                usertag: Joi.string(),
                //.. More fields specified.
            }
            
        }
    ]

```

> Note: in case schema is not specified, no validation is performed of the request body.

#### Authentication

Authentication is based on [Passport](http://passportjs.org/). To configure authentication, the following steps are required:

1) Configure at least one Passport authentication strategy to use. Normally if you have only one strategy, this will be 
 the default strategy.
2) Enable authentication globally or on a per path basis. A path specific configuration overrides the global configuration. 
    * In case authentication is enabled, the required call to `passport.initialize()` is automatically added as the 
     *first* middleware configured for this route. 
    * Configuring authentication on a path can be done using a simple boolean. In this case the default strategy is used
     for authentication
    * Configurating authentication on a path can also be done using a string. In this case, it refers to the name of the
    strategy in the `authStrategies` object.

Example using JWT:
```js

// Configure the strategy
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

let JWT_OPTS = {};
JWT_OPTS.jwtFromRequest = ExtractJwt.fromAuthHeader();
JWT_OPTS.secretOrKey = 'very very secret';
JWT_OPTS.issuer = '...';

passport.use(new JwtStrategy(JWT_OPTS, (jwt_payload, done) => {
    return done(null, jwt_payload);
}));

// Service configuration
module.exports = CloudServant.restServiceModule({
    name: 'auth-example',
    cors: true,
    debug: true,
    authStrategies: {
        default: passport.authenticate('jwt', {session: false})
    },
    paths: [
        
    ]
});
```

## Message Service Definition

Message Service modules are defined by called the `messageModule()` function on the CloudServant API Object. The
method takes an options object specifying the definition of the service module:

```js
const CloudServant = require('cloud-servant')(configFile, configTreePath);

module.exports = CloudServant.messageModule({
    name: 'REQUIRED: Name of the service module',
    debug: 'Boolean: enables debugging logging of the framework',
    topicName: 'Firebase-only: specify the name of the topic to listen too',
    handler: function(LOGGER, event) {
        // LOGGER is an instance of the generic Logging class
        // event is the event object containing the message. It is guaranteed to have the following properties:
        // - json : A JSON object with the contents of the data
        // - stringData: A string representation of the data
        // - data: The original data of the message
        // Note that the event object of the original message may be passed so additional properties may be present. Usage
        // these properties limits the portability of your code.
        
        // This method may return a Promise object in case asynchronous operations are involved. If no Promise is returned,
        // the function execution can be stopped immediately after the function returns by the underlying platform.   
    }
});
```
