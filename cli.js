#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const truffleYargs = require('.')(yargs);
const yargDefs = require('./lib/yargs-defs');

// grab some initial options we need to init the commands
// such as find the contract JSON artifact files
const argv = yargs.options(yargDefs.truffle).argv;

// actually run yargs on the artifact files to create commands and options
truffleYargs(argv)
  .demandCommand(1, 'Specify at least one command to run.')
  .strict()
  .help()
  .argv;
