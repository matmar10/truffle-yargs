'use strict';

// const path = require('path');
const yargs = require('yargs');
const truffleYargs = require('./')(yargs);
const Web3 = require('web3');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');

truffleYargs('./contracts/*.json', {
  contracts: {
    Token: {

    }
  },
  builder: {
    owner: {
      alias: 'address',
    },
  },
  provider,
  // truffleConfig: path.join(__dirname, '/../smartsukuk-dual-mudaraba/truffle.js'),
})
  .demandCommand(1, 'Specify at least one command to run.')
  .strict()
  .help()
  .argv;
