'use strict';

// Solidity => yargs type
const types = {
  address: 'string',
  bool: 'boolean',
  int: 'number',
  uint: 'number',
};

for (let i = 8; i <= 256; i += 8) {
  const int = `int${i}`;
  const uint = `uint${i}`;
  types[int] = int;
  types[uint] = uint;
}

module.exports = types;
