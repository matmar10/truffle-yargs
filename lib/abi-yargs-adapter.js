'use strict';

/* eslint no-console: 0 */
const merge = require('deepmerge');
const abiTypes = require('./abi-types');

class AbiYargsAdapter {
  constructor(yargs, options = {
    abiTypes: abiTypes,
    builder: {},
    commands: {},
    input: {},
    output: {},
  }) {
    this.yargs = yargs;
    this.options = options;
  }

  // transformInput(input) {}

  buildYargsFromAbiMap(abiMap, options = {}) {
    const listOfContractNames = Object.keys(abiMap);
    listOfContractNames.forEach((contractName) => {
      const contractAbi = abiMap[contractName];
      const commands = this.buildYargsFromAbi(contractAbi, options);
      for (const commandName in commands) {
        commands[commandName].command = `${contractName}.${commands[commandName].command}`;
        this.yargs.command(commands[commandName]);
      }
    });
    return this.yargs;
  }

  buildYargsFromAbi(abi, options = {}) {
    const opts = merge(this.options, options);
    const commands = {};
    abi.forEach((node) => {
      const { constant, type, name, inputs, outputs, stateMutability } = node;

      if ('fallback' === type) {
        const commandOpts = opts.commands.sendTransaction || opts.commands.fallback || {};
        commands['sendTransaction'] = {
          alias: 'fallback',
          command: 'sendTransaction',
          description: 'Pay ether to the contract\'s fallback function.',
          builder: merge(opts.web3, commandOpts.builder || {}),
          handler: function (argv) {
            console.error('Would have run the function "sendTransaction" (but no handler defined):', argv);
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
            alias: [],
            name: input.name,
            type: this.getType(input.type, opts),
            description: `solidity ${input.type}`,
            demandOption: true,
          };
          const globalOptionDefinition = opts.builder[input.name] || {};
          if (globalOptionDefinition.alias && !Array.isArray(globalOptionDefinition.alias)) {
            globalOptionDefinition.alias = [globalOptionDefinition.alias];
          }
          const commandOptionDefinition = commandOpts.builder[input.name] || {};
          if (commandOptionDefinition.alias && !Array.isArray(commandOptionDefinition.alias)) {
            commandOptionDefinition.alias = [commandOptionDefinition.alias];
          }
          const def = merge.all([
            defaultOptionDefinition,
            globalOptionDefinition,
            commandOptionDefinition,
          ]);
          if (input.name !== def.name) {
            def.alias.push(input.name);
          }
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
          outputDescription = `Returns a ${output.type}.`;
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
            console.log(`Would run the function "${name}" (but no handler defined):`, argv);
          },
          strict: true,
        };
      }
    });

    return commands;
  }

  getType(type, options) {
    for (let i = 0; i < options.abiTypes.length; i++) {
      const [regex, type] = options.abiTypes[i];
      if (regex.exec(type)) {
        return type;
      }
    }
    throw new Error(`Not found: type "${type}"`);
  }

  addWeb3Options(opts, options) {
    return merge(opts, options.web3Options);
  }
}

module.exports = AbiYargsAdapter;
