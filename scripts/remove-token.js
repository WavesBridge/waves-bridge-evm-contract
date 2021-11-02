const {BRIDGE_ADDRESS} = require("./_script-const");
const {asciiToHex} = web3.utils;
const {question, pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("Bridge");

module.exports = async (callback) => {
  try {
    const bridgeAddress = await question('What Bridge contract address do you want to use?', BRIDGE_ADDRESS);
    const bridge = await Bridge.at(bridgeAddress);
    const tokenSource = await question('Token source', 'ETH');
    const tokenSourceAddress = await question('Token source address (hex 0x...)', '0x...');
    const newAuthority = await question('New Authority', '0x...');

    console.log(`You are going to remove token ${tokenSourceAddress} from ${tokenSource}, and set new authority to ${newAuthority}`);
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await bridge.removeToken(asciiToHex(tokenSource), tokenSourceAddress, newAuthority);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};
