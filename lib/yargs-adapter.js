'use strict';

/* eslint no-console: 0 */
const Promise = require('bluebird');
const merge = require('deepmerge');
const TruffleContract = require('@truffle/contract');
const TruffleConfig = require('@truffle/config');
const TruffleProvider = require('@truffle/provider');
const Web3 = require('Web3');
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
    this.callbacks = {};
  }

  getWeb3(argv) {
    return new Web3(this.getProvider(argv));
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
      yargDefs.contract || {},
      yargDefs.truffle || {},
      yargDefs.web3 || {},
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
    (node.inputs || []).forEach((input, i) => {
      // handle hash maps which end up as unnamed
      if (!input.name) {
        const postfix = node.inputs.length > 1 ? i + 1 : '';
        input.name = `${input.type}${postfix}`;
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

  buildYargsFromArtifactMap(artifactMap, options = {}) {
    const listOfContractNames = Object.keys(artifactMap);
    listOfContractNames.forEach((contractName) => {
      const contractTruffleArtifact = artifactMap[contractName];
      this.yargs.contracts = this.yargs.contracts || {};
      this.yargs.contracts[contractName] = this.yargs.contracts[contractName] || {};
      const commands = this.buildYargsFromArtifact(contractTruffleArtifact, options);
      for (const commandName in commands) {
        commands[commandName].command = `${contractName}.${commands[commandName].command}`;
        this.yargs.command(commands[commandName]);
        this.yargs.contracts[contractName][commandName] = commands[commandName];
      }
    });

    // add new method to allow executing programmatic functions
    this.yargs.contract = (contractName, at) => {
      if (!this.yargs.contracts[contractName]) {
        throw new Error(`No contract named ${contractName} found in artifacts.`);
      }
      const proxy = {};
      for (const methodName in this.yargs.contracts[contractName]) {
        proxy[methodName] = function (params) {
          if ('object' !== typeof params) {
            throw new TypeError('Arguments must be passed as named map (object).');
          }
          const args = [`${contractName}.${methodName}`];
          args.push('--at', at);
          for (const key in params) {
            args.push(`--${key}`, params[key]);
          }
          return new Promise((resolve, reject) => {
            this.callbackForContractMethod(contractName, methodName, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
              this.unsetCallbackForContractMethod(contractName, methodName);
            });
            this.yargs.strict().parse(args);
          });
        }.bind(this);
      }
      return proxy;
    };

    return this.yargs;
  }

  addWeb3OptionsParameter(trxnArgs, argv) {
    const keys = Object.keys(yargDefs.web3);
    const opts = {};
    keys.forEach((key) => {
      const val = argv[key];
      if ('undefined' === typeof val) {
        return;
      }
      opts[key] = argv[key];
    });
    if (Object.keys(opts).length) {
      trxnArgs.push(opts);
    }
  }

  callbackForContractMethod(contractName, methodName, callback) {
    this.callbacks[contractName] = this.callbacks[contractName] || {};
    if (callback) {
      this.callbacks[contractName][methodName] = callback;
    }
    return this.callbacks[contractName][methodName];
  }

  unsetCallbackForContractMethod(contractName, methodName) {
    if (this.callbacks[contractName] && this.callbacks[contractName][methodName]) {
      delete this.callbacks[contractName][methodName];
    }
  }

  buildYargsFromArtifact(artifact, options = {}) {
    const opts = merge(this.options, options);
    const commands = {};
    artifact.abi.forEach((node) => {
      const { constant, type, name, inputs, outputs, stateMutability } = node;

      const commandOpts = this.getCommandOpts(artifact.contractName, node, opts);

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
            const callback = this.callbackForContractMethod(artifact.contractName, name);
            try {
              const methodName = this.getMethodNameFromArgv(argv);
              const Contract = TruffleContract(artifact);
              Contract.setProvider(this.getProvider(argv));
              if (!argv.at) {
                // TODO: fallback to what is inside the artifact for this network
                throw new Error('No Contract address specified. Use --at option');
              }
              const contract = await Contract.at(argv.at);
              const trxnArgs = [];
              inputs.forEach((inputDef) => {
                const inputValue = argv[inputDef.name];
                const transformer = getInputHandlerFor(inputDef.type, opts);
                const transformedValue = transformer(inputValue);
                trxnArgs.push(transformedValue);
              });
              this.addWeb3OptionsParameter(trxnArgs, argv);

              const rawResult = await contract[methodName].apply(contract, trxnArgs);
              const [outputDef] = outputs;
              const handler = getOutputHandlerFor(outputDef.type, opts);
              const result = handler(rawResult);
              if (callback) {
                return callback(null, result);
              }
              if ('object' === result) {
                process.stdout.write(JSON.stringify(result, null, 2));
              } else {
                process.stdout.write(result);
              }
              return result;
            } catch (err) {
              if (callback) {
                callback(err);
              } else {
                throw err;
              }
            }
          },
          strict: true,
        }, commandOpts);
      }
    });

    const fallbackName = `${artifact.contractName}.sendTransaction`;
    const fallbackBuilder = this.getBuilderForContractCommand(artifact.contractName, {
      fallbackName,
      payable: true,
    }, opts);
    commands[fallbackName] = {
      alias: 'fallback',
      command: fallbackName,
      description: 'Pay ether to the contract\'s fallback function.',
      builder: fallbackBuilder,
      handler: (argv) => {
        const web3 = this.getWeb3(argv);
        const trxnArgs = [];
        this.addWeb3OptionsParameter(trxnArgs, merge(argv, {
          to: argv.to || argv.at,
        }));
        const [trxn] = trxnArgs;
        return web3.eth.sendTransaction(trxn);
      },
      strict: true,
    };

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
