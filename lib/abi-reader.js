'use strict';

const fs = require('fs');
const glob = require('glob');

module.exports = function (globPath, options = {}) {
  const files = glob.sync(globPath, options.reader);
  const result = {};
  files.forEach((file) => {
    const contract = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(contract);
    result[parsed.contractName] = parsed.abi;
  });
  return result;
};
