"use strict";

module.exports = function(describe, it, delegate) {

    return {
        runTestsInDirectory: function(testdirectory) {
            const superagent    = require('superagent');
            const fs            = require('fs');
            const path          = require('path');
            const chai          = require('chai');
            const expect        = chai.expect;

            function getDirectories (srcpath) {
                console.log("Searching directories in " + srcpath);
                return fs.readdirSync(srcpath)
                    .filter(file => {
                        let is_dir = fs.lstatSync(path.join(srcpath, file)).isDirectory();
                        console.log("Checking file " + file + " -> " + is_dir);
                        return is_dir;
                    })
            }

            function getDirectoryType(dirname) {
                let underscore = dirname.indexOf("_");
                return dirname.substring(0, underscore);
            }


            describe("Running all integration test..", function() {
                this.timeout(200000);

                getDirectories(testdirectory).forEach((dirname) => {
                    const directory = testdirectory + '/' + dirname;
                    const tester = directory + '/test.js';
                    const func = dirname.replace(/_/g, '-');

                    if (fs.existsSync(tester)) {
                        describe("all test in " + directory + ":", () => {

                            let config = {

                            };

                            before((done) => {
                                delegate.deploy(directory, func, (err, deploy_url) => {
                                    console.log("Configured endpoint URL as :" + deploy_url);

                                    config.deploy_url = deploy_url;

                                    console.log('*****************************************************************************');
                                    done(err);
                                });
                            });

                            const createTests = require(tester);
                            let directoryType = getDirectoryType(dirname);

                            if (directoryType === "rest") {
                                createTests(it, superagent, expect, config);
                            } else if (directoryType === "message") {
                                createTests(it, delegate.messageSender, delegate.messageClient, expect, config);
                            } else {
                                throw new Error("Unknown directory type " + directoryType);
                            }

                            after((done) => {
                                delegate.undeploy(func, done);
                            });

                        })
                    }
                });
            });
        }

    };

};
