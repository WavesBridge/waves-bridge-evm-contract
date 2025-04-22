const {asciiToHex} = web3.utils;
const {question, pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("UnitBridgeProxy");

module.exports = async (callback) => {
  try {
    const bridgeAddress = await question('What Bridge contract address do you want to use?');
    const bridge = await Bridge.at(bridgeAddress);
    const tokenSource = await question('Token source', 'ETH');
    const tokenSourceAddress = await question('Token source address (hex 0x...)', '0x...');

    console.log(`You are going to remove token ${tokenSourceAddress} from ${tokenSource}`);
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await bridge.removeToken(asciiToHex(tokenSource), tokenSourceAddress);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};
