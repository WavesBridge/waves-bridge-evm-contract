const {BRIDGE_ADDRESS} = require("./_script-const");

const {question, pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("Bridge");

module.exports = async (callback) => {
  try {
    const bridgeAddress = await question('What Bridge contract address do you want to use?', BRIDGE_ADDRESS);
    const bridge = await Bridge.at(bridgeAddress);
    const validatorAddress = await question('Validator address', '');

    console.log(`You are going to set ${validatorAddress} as validator address for bridge ${bridgeAddress}`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await bridge.setValidator(validatorAddress);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

