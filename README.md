# Cloud Functions NodeJS MicroServices Framework

_***Note: this framework is currently work in progress. The API may change at any time***_

Cloud Functions is a framework aimed to allow to easily write functions running on one 
of the well known Cloud platforms:
 - Google Cloud Functions
 - Amazon AWS Lamba
 - Microsoft Azure (currently not supported)
 
Each of these platforms have their own interfaces to which a service must comply and set 
of backend services which can be interacted with (like databases or messaging platforms). The
aim of the CloudFunctions framework is to bridge these differences and provide developers
with a unified framework to develop for each of these platforms.

This framework was created based on some early experiments with these platforms and the 
effort involved to rewrite an application originally created for AWS Lamba to Google Cloud 
Functions.

The framework is inspired feature-wise by [Hapi.js](https://hapijs.com/), so you'll see quite some of
the internal frameworks of Hapi being used.

## General Features

This framework provides the following features:
- Definition of service modules
- Abstraction of default databases provided by the Cloud provider
- Module configuration based on [Confluence](https://github.com/hapijs/confidence)
- Often used features for REST based services.

## Service Definition
The general way to define a service is to specify the interface and logic of the service and
let the framework generate a module definition based on that definition for the specific
runtime platform you're aiming at:

```js
const CloudFunctions = require('cloud-functions')(configFile, configTreePath);

module.exports = CloudFunctions.restServiceModule({
    // Specification of the service 
});
```

The configFile is a JSON based file which can be read by the [Confluence](https://github.com/hapijs/confidence) package. It is 
used to configure CloudFunctions itself and provide a generic infrastructure to pass 
 values to your service. The format of the config file is detailed below.

Two types of service modules can be created:
- REST Service modules (as shown in the example above)
- Backend Service modules

REST service modules provide a REST based API often to be consumed by clients of your 
API/MicroService. Backend Service modules provide internal logic to be called by REST Service
modules, other Backend Service modules or by other triggers (e.g. file uploads, backend 
processes, etc.). Backend Service modules are triggered in an asynchronous manner by their
callers.

#### General API of the CloudFunctions API object

The CloudFunctions object has the following API:

| Field | Explanation |
|-------|-------------|
| restServiceModule | Method to create a REST service module |
| pluginOptions | Method to retrieve options from the configuration file for a specific path | 
| db | Object representing a connection to the DB object of the underlying Cloud platform, if configured. This is either a connection to [gstore-node](https://github.com/sebelga/gstore-node) or [Dynamoose](https://github.com/automategreen/dynamoose)| 


### Configuration file format

The format of the configuration file is as follows:

| Field    | Explanation                                                                      |
|----------|----------------------------------------------------------------------------------|
| platform | Either "GCF" or "AWS" to run your module on Google Cloud Functions or AWS Lambda |
| googleDatastore | (GCF Specific) Specifies the configuration for google data store and [gstore-node](https://github.com/sebelga/gstore-node)|
|          |                                                                                  |

#### Logging support

TODO:!!!!!! --> Document

#### Google Datastore support

In case the `googleDatastore` object is specifed in the configuration, a Google DataStore and [gstore-node](https://github.com/sebelga/gstore-node) 
object is defined. The CloudFunctions object then has a field `db` as follows:
 
```js
{
   db : {
       gstore : 'GStore-node object'
   }
}
```


### REST Service Modules

REST Service modules are defined by called the `restServiceModule()` function on the CloudFunctions API Object. The
method takes an options object specifying the definition of the service module:

```js
const CloudFunctions = require('cloud-functions')(configFile, configTreePath);

module.exports = CloudFunctions.restServiceModule({
    name: 'REQUIRED: Name of the service module',
    use: "Array of Express/Connect compatbile middleware executed on all paths (see Middleware support below)",
    enableCors: 'Boolean: enables support for CORS on all paths. See CORS support'
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
                //                  and err is JSON.stringified as response payload.
            },
            
            // Extended options
            use: ["Array of Connect/ExpressJS compatible middleware functions, see Middleware support"],
            cors: "Whether to enable or disable CORS for this path. See CORS support",
            schema: "Validation of JSON based payloads. See Payload validation",
        }
    ] 
    // Specification of the service 
});
```

#### Specifying paths and methods

TODO:!!!!!! --> Document


#### Error handling support

Errors occuring within the calls to the handler method are automatically handled. This can be done in a number of ways:
* Exceptions thrown from the handler method are send back to the client as an HTTP Error 500, with the stringified Error object as payload
* The responseCallback method can be called with an object as its second paramater:
    * In case this object is a [Boom](https://github.com/hapijs/boom) object, this is used to send the correct HTTP response to the client
    * In all other cases, a HTTP 500 is send to the client as an HTTP Error 500, with the stringified Error object as payload

#### Middleware support

CloudFunctions has support for Express/Connect based middleware. Middleware can be configured at top level for
 all paths or overridden on a per-path basis as detailed above. 
 
Given the extended configuration needed and the fact that this type of middleware is often used in various services
CloudFunctions has support for the following standard middleware:
* CORS using [Node cors](https://github.com/expressjs/cors).

> Note: Only regular middleware is supported at the moment, not error-handling middleware. Also, not all available
middleware has been tested, so you may run into bugs. In this case, feel free to file a bug.

#### CORS Support

TODO:!!!!!! --> Document


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

TODO:!!!!!! --> Document

