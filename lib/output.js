'use strict';

const merge = require('deepmerge');
const Web3 = require('Web3');

function noop(val) {
  return val;
}

const defaults = {
  address: String,
  bool: Boolean,
  string: String,
  uint: noop,
  uint8: noop,
  uint16: noop,
  uint24: noop,
  uint32: noop,
  uint40: noop,
  uint48: noop,
  uint56: noop,
  uint64: noop,
  uint72: noop,
  uint80: noop,
  uint88: noop,
  uint96: noop,
  uint104: noop,
  uint112: noop,
  uint120: noop,
  uint128: noop,
  uint136: noop,
  uint144: noop,
  uint152: noop,
  uint160: noop,
  uint168: noop,
  uint176: noop,
  uint184: noop,
  uint192: noop,
  uint200: noop,
  uint208: noop,
  uint216: noop,
  uint224: noop,
  uint232: noop,
  uint240: noop,
  uint248: noop,
  uint256: noop,
  int: noop,
  int8: noop,
  int16: noop,
  int24: noop,
  int32: noop,
  int40: noop,
  int48: noop,
  int56: noop,
  int64: noop,
  int72: noop,
  int80: noop,
  int88: noop,
  int96: noop,
  int104: noop,
  int112: noop,
  int120: noop,
  int128: noop,
  int136: noop,
  int144: noop,
  int152: noop,
  int160: noop,
  int168: noop,
  int176: noop,
  int184: noop,
  int192: noop,
  int200: noop,
  int208: noop,
  int216: noop,
  int224: noop,
  int232: noop,
  int240: noop,
  int248: noop,
  int256: noop,
  bytes: Web3.utils.hexToUtf8,
  bytes1: Web3.utils.hexToUtf8,
  bytes2: Web3.utils.hexToUtf8,
  bytes3: Web3.utils.hexToUtf8,
  bytes4: Web3.utils.hexToUtf8,
  bytes5: Web3.utils.hexToUtf8,
  bytes6: Web3.utils.hexToUtf8,
  bytes7: Web3.utils.hexToUtf8,
  bytes8: Web3.utils.hexToUtf8,
  bytes9: Web3.utils.hexToUtf8,
  bytes10: Web3.utils.hexToUtf8,
  bytes11: Web3.utils.hexToUtf8,
  bytes12: Web3.utils.hexToUtf8,
  bytes13: Web3.utils.hexToUtf8,
  bytes14: Web3.utils.hexToUtf8,
  bytes15: Web3.utils.hexToUtf8,
  bytes16: Web3.utils.hexToUtf8,
  bytes17: Web3.utils.hexToUtf8,
  bytes18: Web3.utils.hexToUtf8,
  bytes19: Web3.utils.hexToUtf8,
  bytes20: Web3.utils.hexToUtf8,
  bytes21: Web3.utils.hexToUtf8,
  bytes22: Web3.utils.hexToUtf8,
  bytes23: Web3.utils.hexToUtf8,
  bytes24: Web3.utils.hexToUtf8,
  bytes25: Web3.utils.hexToUtf8,
  bytes26: Web3.utils.hexToUtf8,
  bytes27: Web3.utils.hexToUtf8,
  bytes28: Web3.utils.hexToUtf8,
  bytes29: Web3.utils.hexToUtf8,
  bytes30: Web3.utils.hexToUtf8,
  bytes31: Web3.utils.hexToUtf8,
  bytes32: Web3.utils.hexToUtf8,
};

module.exports = function (type, options = {}) {
  const transformers = merge(defaults, options.output);

  // handle special case where we assume the alias for these to override
  // all length specific versions of the same type
  if (type.match('bytes') && options.output.bytes) {
    return options.output.bytes;
  }
  if (type.match('int') && options.output.int) {
    return options.output.int;
  }
  if (type.match('uint') && options.output.uint) {
    return options.output.uint;
  }

  // look up the transformer function
  const method = transformers[type];
  if (!method) {
    throw new Error(`Unsupported output type: ${type}`);
  }

  // function to be applied on the data
  return method;
};
