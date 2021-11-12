const {asciiToHex} = web3.utils;
const fs = require('fs');
const erc20Abi = JSON.parse(fs.readFileSync('../build/contracts/ERC20.json', 'UTF8')).abi;

const {pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("Bridge");

const { program } = require('commander');

program
  .requiredOption('-b, --bridge <value>', 'Bridge contract address')
  .requiredOption('-ts, --token-source <value>', 'Token source')
  .requiredOption('-tsa, --token-source-address <value>', 'Token source address (hex 0x...)')
  .requiredOption('-tla, --token-local-address <value>', 'Token local address (hex 0x...)')
  .requiredOption('-tt, --token-type <value>', 'Token type (Base, Native, WrappedV0, Wrapped)')
  .option('--network <value>', 'Network')

const TokenType = {
  0: 'Base',
  1: 'Native',
  2: 'WrappedV0',
  3: 'Wrapped',
  "Base": 0,
  "Native": 1,
  "WrappedV0": 2,
  "Wrapped": 3,
}

module.exports = async (callback) => {
  try {
    program.parse();
    const {
      bridge: bridgeAddress, tokenSource, tokenSourceAddress, tokenLocalAddress, tokenType
    } = program.opts();
    const bridge = await Bridge.at(bridgeAddress);
    if (TokenType[tokenType] == null) {
      throw new Error(`Invalid token type ${tokenType}`);
    }
    const erc20Contract = new web3.eth.Contract(erc20Abi, tokenLocalAddress);
    const name = await erc20Contract.methods.name().call();
    const symbol = await erc20Contract.methods.symbol().call();

    console.log(`You are going to add "${tokenType}" token ${tokenSourceAddress} from ${tokenSource}, as ${name} (${symbol}).`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await bridge.addToken(asciiToHex(tokenSource), tokenSourceAddress, tokenLocalAddress, TokenType[tokenType]);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

