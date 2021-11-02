const {BRIDGE_ADDRESS} = require("./_script-const");
const {Big} = require('big.js');
const {asciiToHex} = web3.utils;


const {question, pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("Bridge");

module.exports = async (callback) => {
  try {
    const bridgeAddress = await question('What Bridge contract address do you want to use?', BRIDGE_ADDRESS);
    const bridge = await Bridge.at(bridgeAddress);
    const amount = await question('Amount (float)', '0.1');
    const destination = await question('Destination', 'SOL');
    const recipient = await question('Recipient (hex 0x...)', '0x3ce641702a6be6401c7627d5a76acab18bdc7114a7b2ae48b137f5d99d503d11');

    const amountInt = Big(+amount).times(Big(10).pow(18)).toFixed();

    console.log(`You are going to send ${amount} ETH to ${destination} for ${recipient}`);
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await bridge.lockEth(recipient, asciiToHex(destination), {value: amountInt});
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

