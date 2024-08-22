const {BRIDGE_ADDRESS} = require("./_script-const");
const {asciiToHex} = web3.utils;
const {Big} = require('big.js');
const fs = require('fs');
const erc20Abi = JSON.parse(fs.readFileSync('../build/contracts/ERC20.json', 'UTF8')).abi;

const {question, pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("Bridge");

const TokenType = {
  0: 'Base',
  1: 'Native',
  2: 'Wrapped',
  "Base": 0,
  "Native": 1,
  "Wrapped": 2,
}

module.exports = async (callback) => {
  try {
    const bridgeAddress = await question('What Bridge contract address do you want to use?', BRIDGE_ADDRESS);
    const bridge = await Bridge.at(bridgeAddress);
    const tokenSource = await question('Token source', 'KVN');
    const tokenSourceAddress = await question('Token source address (hex 0x...)', '');
    const tokenLocalAddress = await question('Token local address (hex 0x...)', '');
    const tokenType = await question('Token type (Base, Native, Wrapped)', '');
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

