
<img src="/docs/truffle-yargs.svg" width="200">

-----------------------

Add hearty bash commands to contracts what be stowed in ye's truffle project:

```bash
truffle-contract USDC.balanceOf \
  --at 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 \
  --address 0xdfcb116732ebc9ae2c8939b053363bcf48a37a99 \
  --network mainnet
```

# CLI Standalone

```
npm install -g truffle-yargs
truffle-contract --dir path-to-your/truffle-project
```

# Install

```bash
npm install --save truffle-yargs
```

# Quick Usage

Roll your own CLI within your own truffle project.

For example, create a `cli.js` with your truffle project:

```javascript
#!/usr/bin/env node

const path = require('path');
const yargs = require('yargs');
const truffleYargs = require('truffle-yargs')(yargs);

// by default, this will scan truffle default contracts location
truffleYargs()
  .demandCommand(1, 'Specify at least one command to run.')
  .strict()
  .help()
  .argv;
```

# Programmatic Usage

Run the methods as commands with the same validation and parsing:

```javascript
const yargs = require('yargs');
const truffleYargs = require('truffle-yargs')(yargs);

try {
  truffleYargs()
    .contract('Token', '0x468d834b0FAc4B9D8B2E90bE1cE35A891Ff96Ae9')
    .balanceOf({
      owner: '0x4a378afbc608073d4520c91d70d06cb79a0a31c5',
    })
    .then(balance => {
      console.log('Balance is:', balance);
    }, err => {
      console.error('Error:', err);
    });
```

# Options

## provider (optional)

Manually configure a Web3 provider instead of detecting from truffle config

```javascript
const customProvider = new Web3.providers.HttpProvider('http://localhost:8545');
truffleYargs({
  provider: customProvider
});
```

## contracts (optional)

### String glob pattern of contracts

```javascript
truffleYargs({
  contracts: './custom-build-path/**/*.json'
});
```

### Array of contracts

```javascript
truffleYargs({
  contracts: [
    Token,
    OtherContract,
    SafeMath,
  ]
});
```

### Object hash map of contracts

```javascript
truffleYargs({
  contracts: {
    Token,    
    OtherContract,
    SafeMath,
  }
});
```

## TODO

- Detect deployed address from JSON using truffle config network ID
- Document overrides of commands and options

## Credits

- Hook by Alena Artemova from the Noun Project
- Eye Patch by Javier Sánchez from the Noun Project
- Bone by TS Graphics from the Noun Project
- Pirate Hat by Nakesha Upshaw from the Noun Project
