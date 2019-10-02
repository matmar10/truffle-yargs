'use strict';

const merge = require('deepmerge');

// const coerce = require('./coerce');
const types = require('./types');

const defaultOptions = {
  coerce: {},
  inputs: {},
  types: types,
  returnTypes: [
    [/string/, 'string'],
    [/int/, 'BigNumber'],
    [/address/, 'string'],
    [/bool/, 'boolean'],
    [/bytes/, 'string'],
  ],
  web3: {
    from: {
      type: 'string',
      description: '(optional) The address for the sending account. Uses the web3.eth.defaultAccount property, if not specified. Or an address or index of a local wallet in web3.eth.accounts.wallet.',
    },
    value: {
      type: 'string',
      description: '(optional) The value transferred for the transaction in wei, also the endowment if it’s a contract-creation transaction.',
    },
    gas: {
      type: 'number',
      description: '(optional) The amount of gas to use for the transaction (unused gas is refunded).',
    },
    gasPrice: {
      type: 'string',
      description: '(optional) The price of gas for this transaction in wei, defaults to web3.eth.gasPrice.',
    },
    data: {
      type: 'string',
      desription: '(optional) Either a ABI byte string containing the data of the function call on a contract, or in the case of a contract-creation transaction the initialisation code.',
    },
    nonce: {
      type: 'number',
      description: '(optional) Integer of a nonce. This allows to overwrite your own pending transactions that use the same nonce.',
    },
  },
};

class AbiYargsAdaptor {
  constructor(yargs, options = {}) {
    this.yargs = yargs;
    this.options = merge(defaultOptions, options);
  }

  // transformInput(input) {}

  buildYargsFromAbi(abi, options) {
    const opts = merge(this.options, options);
    const commands = {};
    abi.forEach((node) => {
      const { constant, type, name, inputs, outputs, payable, stateMutability } = node;

      if ('fallback' === type) {
        const commandOpts = opts.commands.sendTransaction || opts.commands.fallback || {};
        commands['sendTransaction'] = {
          alias: 'fallback',
          command: 'sendTransaction',
          description: 'Pay ether to the contract\'s fallback function.',
          builder: merge(opts.web3, commandOpts.builder || {}),
          handler: function (argv) {
            console.log('Would run the function "sendTransaction":', argv);
          },
        };
      }

      if ('function' === type) {
        const commandOpts = opts.commands[name] || { builder: {} };

        // build up an array of options, later added alphabetically
        const options = [];

        // input
        inputs.forEach((input) => {
          if (!input.name) {
            return;
          }
          const defaultOptionDefinition = {
            name: input.name,
            type: this.getType(input.type, opts),
            description: `solidity ${input.type}`,
          };
          const globalOptionDefinition = opts.builder[input.name] || {};
          const commandOptionDefinition = commandOpts.builder[input.name] || {};
          const def = merge.all([
            defaultOptionDefinition,
            globalOptionDefinition,
            commandOptionDefinition,
          ]);
          options.push(def);
        });

        options.sort((a, b) => a.name - b.name);

        // set options as 'builder' object
        const builder = {};
        options.forEach((option) => {
          builder[option.name] = option;
        });

        // output
        let description;
        let outputDescription = '';
        const [output] = outputs;
        if (output) {
          const returnType = this.getReturnType(output.type, opts);
          if (!returnType) {
            throw new Error(`Unknown output type "${output.type}"`);
          }
          outputDescription = `Returns a ${returnType}.`;
        }
        if ('view' === stateMutability) {
          description = `Get (read-only) "${name}" value. ${outputDescription}`;
        } else if (constant) {
          description = `Run "${name}". Does not modify contract state.`;
        } else {
          description = `Execute the "${name}" contract method. Modifies state.`;
        }

        commands[name] = {
          builder,
          command: name,
          description,
          handler: function (argv) {
            console.log(`Would run the function "${name}" with argv:`, argv);
          },
          strict: true,
        };
      }
    });

    return commands;
  }

  getType(type, options) {
    const found = options.types[type];
    if (!found) {
      throw new Error(`Not found: type "${type}"`);
    }
    return found;
  }

  getReturnType(type, options) {
    for (let i = 0; i < options.returnTypes.length; i++) {
      const [regex, description] = options.returnTypes[i];
      if (regex.exec(type)) {
        return description;
      }
    }
    return false;
  }

  addWeb3Options(opts, options) {
    return merge(opts, options.web3Options);
  }
}

const yargsBinderFactory = function (yargs, options) {
  const builder = new AbiYargsAdaptor(yargs, options);
  const factoryFunction = function (abi, overrideOptions) {
    return builder.buildYargsFromAbi(abi, overrideOptions);
  };
  factoryFunction.abiYargsAdaptor = builder;
  return factoryFunction;
};
yargsBinderFactory.AbiYargsAdaptor = AbiYargsAdaptor;

module.exports = yargsBinderFactory;
