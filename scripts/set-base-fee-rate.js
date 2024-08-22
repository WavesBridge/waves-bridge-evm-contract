const { BRIDGE_ADDRESS} = require("./_script-const");
const Bridge = artifacts.require("Bridge");

const {question, pressAnyKey} = require("./_utils");

module.exports = async (callback) => {
  try {
    const bridgeAddress = await question('What Bridge contract address do you want to use?', BRIDGE_ADDRESS);
    const bridge = await Bridge.at(bridgeAddress);
    const baseFeeRate = await question('Base fee rate (float)', '');

    console.log(`You are going to set base fee rate to ${baseFeeRate} for fee bridge ${bridgeAddress}`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await bridge.setBaseFeeRate(Math.floor(baseFeeRate * 10000));
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

