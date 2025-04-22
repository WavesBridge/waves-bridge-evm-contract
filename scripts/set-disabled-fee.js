const { BRIDGE_ADDRESS} = require("./_script-const");
const {Big} = require('big.js');
const fs = require('fs');


const {question, pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("Unit0BridgeProxy");

module.exports = async (callback) => {
  try {
    const bridgeAddress = await question('What Bridge contract address do you want to use?');
    const bridge = await Bridge.at(bridgeAddress);
    const tokenAddress = await question('Token address', '');

    const isDisabledFee = await question('isDisabledFee', 'true');

    console.log(`You are going to ${isDisabledFee === 'true' ? 'disable' : 'enable'} fee in bridge ${bridgeAddress} from token ${tokenAddress}`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await bridge.setDisabledFee(tokenAddress, isDisabledFee === 'true');
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

