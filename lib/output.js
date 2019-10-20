'use strict';

const merge = require('deepmerge');
const Web3 = require('Web3');

function noop(val) {
  return val;
}

function BNToString(bn) {
  return Web3.utils.isBN(bn) ? bn.toString() : String(bn);
}

const defaults = {
  address: String,
  bool: Boolean,
  string: String,
  uint: BNToString,
  uint8: BNToString,
  uint16: BNToString,
  uint24: BNToString,
  uint32: BNToString,
  uint40: BNToString,
  uint48: BNToString,
  uint56: BNToString,
  uint64: BNToString,
  uint72: BNToString,
  uint80: BNToString,
  uint88: BNToString,
  uint96: BNToString,
  uint104: BNToString,
  uint112: BNToString,
  uint120: BNToString,
  uint128: BNToString,
  uint136: BNToString,
  uint144: BNToString,
  uint152: BNToString,
  uint160: BNToString,
  uint168: BNToString,
  uint176: BNToString,
  uint184: BNToString,
  uint192: BNToString,
  uint200: BNToString,
  uint208: BNToString,
  uint216: BNToString,
  uint224: BNToString,
  uint232: BNToString,
  uint240: BNToString,
  uint248: BNToString,
  uint256: BNToString,
  int: BNToString,
  int8: BNToString,
  int16: BNToString,
  int24: BNToString,
  int32: BNToString,
  int40: BNToString,
  int48: BNToString,
  int56: BNToString,
  int64: BNToString,
  int72: BNToString,
  int80: BNToString,
  int88: BNToString,
  int96: BNToString,
  int104: BNToString,
  int112: BNToString,
  int120: BNToString,
  int128: BNToString,
  int136: BNToString,
  int144: BNToString,
  int152: BNToString,
  int160: BNToString,
  int168: BNToString,
  int176: BNToString,
  int184: BNToString,
  int192: BNToString,
  int200: BNToString,
  int208: BNToString,
  int216: BNToString,
  int224: BNToString,
  int232: BNToString,
  int240: BNToString,
  int248: BNToString,
  int256: BNToString,
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
  const transformers = merge(defaults, options.output || {});

  let fn;

  // handle special case where we assume the alias for these to override
  // all length specific versions of the same type
  if (type.match('bytes') && options.output.bytes) {
    fn = options.output.bytes;
  } else if (type.match('int') && options.output.int) {
    fn = options.output.int;
  } else if (type.match('uint') && options.output.uint) {
    fn = options.output.uint;
  } else {
    // look up the transformer function
    fn = transformers[type];
    if (!fn) {
      throw new Error(`Unsupported output type: ${type}`);
    }
  }

  // function to be applied on the data
  return fn;
};
