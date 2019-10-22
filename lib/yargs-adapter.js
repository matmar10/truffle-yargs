'use strict';

/* eslint no-console: 0 */
const merge = require('deepmerge');
const TruffleContract = require('@truffle/contract');
const TruffleConfig = require('@truffle/config');
const TruffleProvider = require('@truffle/provider');
const yargDefs = require('./yargs-defs');
const abiTypes = require('./abi-types');
const getInputHandlerFor = require('./input');
const getOutputHandlerFor = require('./output');

const defaults = {
  builder: {},
  commands: {},
  input: {},
  output: {},
  abiTypes: abiTypes,
  truffle: yargDefs.truffle,
  contract: yargDefs.contract,
  web3: yargDefs.web3,
};

class YargsAdapter {
  constructor(yargs, options = {}) {
    this.yargs = yargs;
    this.options = merge(defaults, options);
  }

  getProvider(argv) {
    const opts = merge(this.options, argv);
    if (opts.provider) {
      return opts.provider;
    }
    const truffleOptions = merge({
      network: opts.networkName,
      workingDirectory: opts.workingDirectory,
    }, argv);
    const truffleConfig = TruffleConfig.detect(truffleOptions);
    return TruffleProvider.create(truffleConfig);
  }

  getCommandOpts(contract, node, opts) {
    // builder for method
    const generalCommand = opts.commands &&
      opts.commands[node.name] ?
      opts.commands[node.name] : {};

    // builder for contract command
    const contractCommand = opts.contracts &&
      opts.contracts[contract] &&
      opts.contracts[contract].commands &&
      opts.contracts[contract].commands[node.name] ?
      opts.contracts[contract].commands[node.name] : {};

    const command = merge(generalCommand, contractCommand);
    delete command.builder;
    delete command.handler;
    return command;
  }

  getBuilderForContractCommand(contract, node, opts) {
    // safe fallback when nothing defined
    const builderCommon = merge.all([
      opts.contract || {},
      opts.network || {},
      opts.web3 || {},
    ]);

    // builder for method
    const builderForCommand = opts.commands &&
      opts.commands[node.name] &&
      opts.commands[node.name].builder ?
      opts.commands[node.name].builder : {};

    // builder for contract
    const builderForContract = opts.contracts &&
      opts.contracts[contract] &&
      opts.contracts[contract].builder ?
      opts.contracts[contract].builder : {};

    // builder for contract command
    const builderForContractCommand = opts.contracts &&
      opts.contracts[contract] &&
      opts.contracts[contract].commands &&
      opts.contracts[contract].commands[node.name] &&
      opts.contracts[contract].commands[node.name].builder ?
      opts.contracts[contract].commands[node.name].builder : {};

    // build up an array of options, later added alphabetically
    const args = [];

    // input
    (node.inputs || []).forEach((input) => {
      if (!input.name) {
        return;
      }
      const alias = [];
      let strippedName = this.stripPrefix(input.name);
      if (strippedName) {
        alias.push(input.name);
      } else {
        strippedName = input.name;
      }

      const def = {
        alias,
        demandOption: true,
        description: `Solidity ${input.type} type`,
        group: 'method',
        name: strippedName,
        type: this.getType(input.type, opts),
      };
      args.push(def);
    });

    args.sort((a, b) => a.name - b.name);

    // set options as 'builder' object
    const builderForArgs = {};
    args.forEach((option) => {
      builderForArgs[option.name] = option;
    });

    const builder = merge.all([
      builderForArgs,
      builderForCommand,
      builderForContract,
      builderForContractCommand,
      builderCommon,
    ]);

    if (!node.payable) {
      delete builder.value;
    }

    return builder;
  }

  // transformInput(input) {}

  buildYargsFromArtifactMap(artifactMap, options = {}) {
    const listOfContractNames = Object.keys(artifactMap);
    listOfContractNames.forEach((contractName) => {
      const contractTruffleArtifact = artifactMap[contractName];
      const commands = this.buildYargsFromArtifact(contractTruffleArtifact, options);
      for (const commandName in commands) {
        commands[commandName].command = `${contractName}.${commands[commandName].command}`;
        this.yargs.command(commands[commandName]);
      }
    });
    return this.yargs;
  }

  buildYargsFromArtifact(artifact, options = {}) {
    const opts = merge(this.options, options);
    const commands = {};
    artifact.abi.forEach((node) => {
      const { constant, type, name, inputs, outputs, stateMutability } = node;

      const commandOpts = this.getCommandOpts(artifact.contractName, node, opts);

      if ('fallback' === type) {
        const builder = this.getBuilderForContractCommand(artifact.contractName, merge({
          name: 'sendTransaction',
        }, node), opts);
        commands['sendTransaction'] = {
          alias: 'fallback',
          command: 'sendTransaction',
          description: 'Pay ether to the contract\'s fallback function.',
          builder,
          handler: (argv) => {
            console.error('Would have run the function "sendTransaction" (but no handler defined):', argv);
            throw new Error('TODO');
          },
        };
      }

      if ('function' === type) {
        const builder = this.getBuilderForContractCommand(artifact.contractName, node, opts);

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

        commands[name] = merge({
          builder,
          command: name,
          description,
          handler: async (argv) => {
            const methodName = this.getMethodNameFromArgv(argv);
            const Contract = TruffleContract(artifact);
            Contract.setProvider(this.getProvider(argv));
            if (!argv.at) {
              throw new Error('No Contract address specified. Use --at option');
            }
            const contract = await Contract.at(argv.at);
            const args = [];
            inputs.forEach((inputDef) => {
              const inputValue = argv[inputDef.name];
              const transformer = getInputHandlerFor(inputDef.type, opts);
              const transformedValue = transformer(inputValue);
              args.push(transformedValue);
            });
            const rawResult = await contract[methodName].apply(contract, args);

            const [outputDef] = outputs;
            const handler = getOutputHandlerFor(outputDef.type, opts);
            const result = handler(rawResult);
            if (commandOpts.handler) {
              return commandOpts.handler(result);
            }
            if ('object' === result) {
              process.stdout.write(JSON.stringify(result, null, 2));
            } else {
              process.stdout.write(result);
            }
            return result;
          },
          strict: true,
        }, commandOpts);
      }
    });

    return commands;
  }

  getType(type, options) {
    for (let i = 0; i < options.abiTypes.length; i++) {
      const [regex, mappedType] = options.abiTypes[i];
      if (regex.exec(type)) {
        return mappedType;
      }
    }
    throw new Error(`Not found: type "${type}"`);
  }

  stripPrefix(argumentName) {
    const matched = argumentName.match('_');
    return matched && 0 === matched.index ?
      argumentName.substring(1) : false;
  }

  getMethodNameFromArgv(argv) {
    const [contractAndMethod] = argv._;
    if (!contractAndMethod) {
      throw new Error('Could not determine contract method name from argv.');
    }
    const [contract, method] = contractAndMethod.split('.');
    if (!contract || !method) {
      throw new Error(`Could not determine contract method name from argv: ${contractAndMethod}`);
    }
    return method;
  }
}

module.exports = YargsAdapter;
