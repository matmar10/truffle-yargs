'use strict';

const AbiYargsAdapter = require('./lib/yargs-adapter');
const abiReader = require('./lib/abi-reader');

const yargsBinderFactory = function (yargs) {
  const factoryFunction = function (options) {
    const adapter = new AbiYargsAdapter(yargs, options);
    factoryFunction.abiYargsAdapter = adapter;
    const contractDefinitions = abiReader(options);
    return adapter.buildYargsFromArtifactMap(contractDefinitions, options);
  };
  return factoryFunction;
};
yargsBinderFactory.AbiYargsAdaptor = AbiYargsAdapter;
yargsBinderFactory.abiReader = abiReader;

module.exports = yargsBinderFactory;
