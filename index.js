'use strict';

const AbiYargsAdapter = require('./lib/abi-yargs-adapter');
const abiReader = require('./lib/abi-reader');
const merge = require('deepmerge');

const yargsBinderFactory = function (yargs, options) {
  const adapter = new AbiYargsAdapter(yargs, options);
  const factoryFunction = function (globPaths, overrideOptions) {
    const opts = merge(options, overrideOptions);
    const contractAbiDefinitions = abiReader(globPaths, opts);
    return adapter.buildYargsFromAbiMap(contractAbiDefinitions, overrideOptions);
  };
  factoryFunction.abiYargsAdapter = adapter;
  return factoryFunction;
};
yargsBinderFactory.AbiYargsAdaptor = AbiYargsAdapter;
yargsBinderFactory.abiReader = abiReader;

module.exports = yargsBinderFactory;
