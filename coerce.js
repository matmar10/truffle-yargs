'use strict';

const BN = require('bn.js');

module.exports = {
  strToBN: function strToBN(val) {
    return new BN(val);
  },
};
