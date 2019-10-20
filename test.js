'use strict';

const path = require('path');
const yargs = require('yargs');
const truffleYargs = require('./')(yargs);

truffleYargs('./contracts/*.json', {
  truffleConfig: path.join(__dirname, '/../smartsukuk-dual-mudaraba/truffle.js'),
})
  .demandCommand(1, 'Specify at least one command to run.')
  .strict()
  .help()
  .argv;
