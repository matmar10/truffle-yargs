#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const abiYargs = require('./')(yargs);

const contract = require('./contracts/Token.json');

const commands = abiYargs(contract.abi, {
  // override generated defaults per command
  commands: {
    setDividendPayerWhitelist: {
      description: 'Set whitelist status for the given address so it may pay dividends to the sukuk (or not)',
      builder: {
        value: {
          name: 'whitelisted',
          description: 'New status for the given address',
        },
      },
    },
  },

  builder: {
    addr: {
      name: 'address',
      description: 'Address to update status of whitelist',
    },
    at: {
      description: 'Address of the contract to execute.',
      type: 'string',
    },
  },

  // coerce
  inputs: {

  },
});

for (const name in commands) {
  yargs.command(commands[name]);
}


const argv = yargs
  .demandCommand(1, 'Specify at least one command to run.')
  .strict()
  .help()
  .argv;
