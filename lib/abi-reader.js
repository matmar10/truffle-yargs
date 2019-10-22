'use strict';

const fs = require('fs');
const glob = require('glob');
const path = require('path');

module.exports = function (options = {}) {
  if ('object' === typeof options.contracts) {
    if (Array.isArray(options.contracts)) {
      const result = {};
      options.contracts.forEach((contract) => {
        if (!contract.contractName) {
          throw new Error('Not a truffle contract: expected contractName property');
        }
        result[contract.contractName];
      });
      return result;
    }
    return options.contracts;
  }
  let contractsGlobPath;
  if ('string' === options.contracts) {
    contractsGlobPath = options.contracts;
  } else {
    contractsGlobPath = path.join(options.workingDirectory, options.contractsGlobPattern || 'build/contracts/*.json');
  }

  const files = glob.sync(contractsGlobPath);
  if (!files.length) {
    throw new Error(`No contracts found in directory: ${contractsGlobPath}`);
  }
  const result = {};
  files.forEach((file) => {
    const contract = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(contract);
    if (!parsed.contractName) {
      throw new Error(`Expected property contractName in parsed JSON for file: '${file}'`);
    }
    result[parsed.contractName] = parsed;
  });
  return result;
};
