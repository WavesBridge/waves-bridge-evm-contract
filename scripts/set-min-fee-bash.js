const {Big} = require('big.js');
const fs = require('fs');
const erc20Abi = JSON.parse(fs.readFileSync('../build/contracts/ERC20.json', 'UTF8')).abi;
const { program } = require('commander');
const {pressAnyKey} = require("./_utils");
const FeeOracle = artifacts.require("FeeOracle");

program
  .requiredOption('-o, --fee-oracle <value>', 'Fee Oracle contract address')
  .requiredOption('-t, --token <value>', 'Token address')
  .requiredOption('-f, --fee <value>', 'Fee (float)')
  .option('--network <value>', 'Network')

module.exports = async (callback) => {
  try {
    program.parse();
    const {
      feeOracle: feeOracleAddress, token: tokenAddress, fee
    } = program.opts();
    const feeOracle = await FeeOracle.at(feeOracleAddress);
    const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress);
    const decimals = await erc20Contract.methods.decimals().call();

    const feeInt = Big(fee).times(Big(10).pow(+decimals)).toFixed();

    console.log(`You are going to change fee in fee oracle ${feeOracleAddress} for token ${tokenAddress} to ${fee} (${feeInt})`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await feeOracle.setMinFee(tokenAddress, feeInt);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

