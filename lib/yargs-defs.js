'use strict';

module.exports = {
  contract: {
    at: {
      group: 'Contract',
      type: 'string',
      description: 'The address of the contract to run the command on. Attempts to default to contract listed inside ABI file for specified network.',
      example: '0x143D5A2d4DDA8edC2fB2a315d945D59354B5fDBa',
    },
  },
  truffle: {
    networkName: {
      group: 'Truffle',
      alias: 'network',
      type: 'string',
      default: 'development',
      description: 'The name of a network mentioned in truffle config to run the command on.',
    },
    contractsGlobPattern: {
      group: 'Truffle',
      alias: 'contracts',
      type: 'string',
      description: 'Globl path(s) to where truffle contract build artifacts are stored.',
      hidden: true,
    },
    workingDirectory: {
      group: 'Truffle',
      alias: 'dir',
      type: 'string',
      hidden: true,
    },
  },
  web3: {
    to: {
      group: 'Web3',
      type: 'string',
      description: 'The address to send ethereum to. Usually specified instead as the --at parameter',
      conflicts: ['at'],
    },
    from: {
      group: 'Web3',
      type: 'string',
      description: 'The address for the sending account. \
Uses the web3.eth.defaultAccount property, if not specified. Or an address or index of a local wallet in web3.eth.accounts.wallet.',
    },
    gas: {
      group: 'Web3',
      type: 'number',
      description: 'The amount of gas to use for the transaction (unused gas is refunded).',
    },
    gasPrice: {
      group: 'Web3',
      type: 'string',
      description: 'The price of gas for this transaction in wei, defaults to web3.eth.gasPrice.',
    },
    nonce: {
      group: 'Web3',
      type: 'number',
      description: 'Integer of a nonce. This allows to overwrite your own pending transactions that use the same nonce.',
      hidden: true,
    },
    value: {
      group: 'Web3',
      type: 'string',
      description: 'The value transferred for the transaction in wei, also the endowment if it’s a contract-creation transaction.',
    },
    data: {
      grop: 'Web3',
      type: 'object',
      description: 'Data to send in the transaction',
      hidden: true,
    },
  },
};
