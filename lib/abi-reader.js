'use strict';

const fs = require('fs');
const glob = require('glob');

module.exports = function (globPathOrMap, options = {}) {
  if ('string' === typeof globPathOrMap) {
    const files = glob.sync(globPathOrMap, options.reader);
    const result = {};
    files.forEach((file) => {
      const contract = fs.readFileSync(file, 'utf8');
      const parsed = JSON.parse(contract);
      result[parsed.contractName] = parsed;
    });
    return result;
  }
  if ('object' === typeof globPathOrMap) {
    return globPathOrMap;
  }
  throw new Error('Expected input for contract ABI: expected a glob path (string) or a map of "ContractName" => Object');
};
