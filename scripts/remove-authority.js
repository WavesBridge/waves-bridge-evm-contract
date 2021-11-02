const {BRIDGE_ADDRESS} = require("./_script-const");

const {question, pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("Bridge");

module.exports = async (callback) => {
  try {
    const sender = (await web3.eth.getAccounts())[0];
    const bridgeAddress = await question('What Bridge contract address do you want to use?', BRIDGE_ADDRESS);
    const bridge = await Bridge.at(bridgeAddress);
    const authorityType = await question('Authority type', '');
    const address = await question('Authority user address', sender);

    console.log(`You are going to remove ${authorityType} authority from ${address} for bridge ${bridgeAddress}`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await bridge.revokeRole(web3.utils.keccak256(authorityType), address);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

