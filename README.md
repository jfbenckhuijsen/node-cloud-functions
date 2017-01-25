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

## General Features

This framework provides the following features:
- Definition of service modules
- Abstraction of default databases provided by the Cloud provider
- Module configuration based on Confluence

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

Two types of service modules can be created:
- REST Service modules
- Backend Service modules

REST service modules provide a REST based API often to be consumed by clients of your 
API/MicroService. Backend Service modules provide internal logic to be called by REST Service
modules, other Backend Service modules or by other triggers (e.g. file uploads, backend 
processes, etc.). Backend Service modules are triggered in an asynchronous manner by their
callers.

### REST Service Modules
