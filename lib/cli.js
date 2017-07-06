#! /usr/bin/env node
/*
 ISC License

 Copyright (c) 2017 Jeroen Benckhuijsen

 Permission to use, copy, modify, and/or distribute this software for any
 purpose with or without fee is hereby granted, provided that the above
 copyright notice and this permission notice appear in all copies.

 THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 PERFORMANCE OF THIS SOFTWARE.
 */
'use strict';

const chalk = require('chalk');
const ArgumentParser = require('argparse').ArgumentParser;
const parser = new ArgumentParser({
    version: '0.0.1',
    addHelp:true,
    description: 'NODE Cloud functions'
});


const subparsers = parser.addSubparsers({
    title:'Commands',
    dest:"subcommand_name"
});


const init = subparsers.addParser('init', {addHelp:true});
init.addArgument(
    [ '-p', '--platform' ],
    {
        action: 'store',
        help: 'The Cloud platform to use',
        choices: ['GCF', 'AWS'],
        required: true
    }
);
init.addArgument(
    ['-t', '--type'],
    {
        action: 'store',
        help: 'The type of module to create',
        choices: ['REST', 'rest'],
        required: true
    }
);
init.addArgument(
    ['-n', '--name'],
    {
        action: 'store',
        help: 'Name of the cloud functions',
        required: true
    }
);
init.addArgument(
    ['--cors'],
    {
        action: 'storeTrue',
        nargs: 0,
        help: "Enable CORS support for all paths"

    }
);

function writeErrHandler(okMessage, errorMessage) {
    return (err) => {
        if(err) {
            return console.log(chalk.red(errorMessage));
        }

        console.log(chalk.green(okMessage));

    }
}

const commands = {
    init: function(args) {
        const fs = require('fs');

        const config = {
            "platform" : args.platform
        };

        fs.writeFile("config.json", JSON.stringify(config), {flag: 'wx'},
            writeErrHandler("Configuration file created.","The config.json file already exists. Not created."));

        if (args.type == 'REST' || args.type == 'rest') {

            fs.writeFile('index.js',
                `"use strict";

const CloudFunctions = require('cloud-functions')(__dirname + '/config.json', '');

module.exports = CloudFunctions.restServiceModule({
    name: '${args.name}',
    cors: ${args.cors},
    paths : [
        /* Configure paths here by added rows like:
        {
            method: "POST",
            path: "/",
            auth: false,
            handler: (LOGGER, req, res, responseCallback) => {
                responseCallback('Hello World');
            }
        }
        */
    ]
});
`,
                {flag: 'wx'},
                writeErrHandler("Skeleton of index.js created.","The index.json file already exists. Not created.")
            );
        }

    }
};

const args = parser.parseArgs();
commands[args.subcommand_name](args);
