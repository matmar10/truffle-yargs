'use strict';

const AbiYargsAdapter = require('./lib/abi-yargs-adapter');
const abiReader = require('./lib/abi-reader');

const yargsBinderFactory = function (yargs) {
  const factoryFunction = function (globPaths, options) {
    const adapter = new AbiYargsAdapter(yargs, options);
    factoryFunction.abiYargsAdapter = adapter;
    const contractAbiDefinitions = abiReader(globPaths, options);
    return adapter.buildYargsFromArtifactMap(contractAbiDefinitions, options);
  };
  return factoryFunction;
};
yargsBinderFactory.AbiYargsAdaptor = AbiYargsAdapter;
yargsBinderFactory.abiReader = abiReader;

module.exports = yargsBinderFactory;
