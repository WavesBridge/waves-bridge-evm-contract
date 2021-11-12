const {asciiToHex} = web3.utils;
const {pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("Bridge");
const { program } = require('commander');

program
  .requiredOption('-b, --bridge <value>', 'Bridge contract address')
  .requiredOption('-ts, --token-source <value>', 'Token source')
  .requiredOption('-tsa, --token-source-address <value>', 'Token source address (hex 0x...)')
  .requiredOption('-a, --new-authority <value>', 'Token local address (hex 0x...)')
  .option('--network <value>', 'Network')

module.exports = async (callback) => {
  try {
    program.parse();
    const {
      bridge: bridgeAddress, tokenSource, tokenSourceAddress, newAuthority
    } = program.opts();
    const bridge = await Bridge.at(bridgeAddress);


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
