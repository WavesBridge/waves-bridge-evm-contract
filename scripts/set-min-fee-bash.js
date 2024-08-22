const {Big} = require('big.js');
const fs = require('fs');
const erc20Abi = JSON.parse(fs.readFileSync('../build/contracts/ERC20.json', 'UTF8')).abi;
const { program } = require('commander');
const {pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("Bridge");

program
  .requiredOption('-b, --bridge <value>', 'Bridge contract address')
  .requiredOption('-t, --token <value>', 'Token address')
  .requiredOption('-f, --fee <value>', 'Fee (float)')
  .option('--network <value>', 'Network')

module.exports = async (callback) => {
  try {
    program.parse();
    const {
      bridge: bridgeAddress, token: tokenAddress, fee
    } = program.opts();
    const bridge = await Bridge.at(bridgeAddress);
    const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress);
    const decimals = await erc20Contract.methods.decimals().call();

    const feeInt = Big(fee).times(Big(10).pow(+decimals)).toFixed();

    console.log(`You are going to change fee in bridge ${bridgeAddress} from token ${tokenAddress} to ${fee} (${feeInt})`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await bridge.setMinFee(tokenAddress, feeInt);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

