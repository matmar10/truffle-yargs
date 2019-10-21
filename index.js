'use strict';

const AbiYargsAdapter = require('./lib/yargs-adapter');
const abiReader = require('./lib/abi-reader');

const yargsBinderFactory = function (yargs) {
  const factoryFunction = function (globPathsOrMap, options) {
    const adapter = new AbiYargsAdapter(yargs, options);
    factoryFunction.abiYargsAdapter = adapter;
    const contractAbiDefinitions = abiReader(globPathsOrMap, options);
    return adapter.buildYargsFromArtifactMap(contractAbiDefinitions, options);
  };
  return factoryFunction;
};
yargsBinderFactory.AbiYargsAdaptor = AbiYargsAdapter;
yargsBinderFactory.abiReader = abiReader;

module.exports = yargsBinderFactory;
