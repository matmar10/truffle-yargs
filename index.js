'use strict';

const merge = require('deepmerge');
const path = require('path');
const AbiYargsAdapter = require('./lib/yargs-adapter');
const abiReader = require('./lib/abi-reader');

const defaultWorkingDirectory = path.join(__dirname, '/../../');

const defaults = {
  workingDirectory: defaultWorkingDirectory,
  contracts: path.join(defaultWorkingDirectory, 'build/contracts/*.json'),
};

const yargsBinderFactory = function (yargs) {
  const factoryFunction = function (options) {
    const opts = merge(defaults, options);
    const adapter = new AbiYargsAdapter(yargs, opts);
    factoryFunction.abiYargsAdapter = adapter;
    const contractDefinitions = abiReader(opts);
    return adapter.buildYargsFromArtifactMap(contractDefinitions, opts);
  };
  return factoryFunction;
};
yargsBinderFactory.AbiYargsAdaptor = AbiYargsAdapter;
yargsBinderFactory.abiReader = abiReader;

module.exports = yargsBinderFactory;
