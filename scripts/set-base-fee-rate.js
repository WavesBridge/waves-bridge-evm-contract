const { FEE_ORACLE_ADDRESS} = require("./_script-const");

const {question, pressAnyKey} = require("./_utils");
const FeeOracle = artifacts.require("FeeOracle");

module.exports = async (callback) => {
  try {
    const feeOracleAddress = await question('What fee oracle contract address do you want to use?', FEE_ORACLE_ADDRESS);
    const feeOracle = await FeeOracle.at(feeOracleAddress);
    const baseFeeRate = await question('Base fee rate (float)', '');

    console.log(`You are going to set base fee rate to ${baseFeeRate} for fee oracle ${feeOracleAddress}`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await feeOracle.setBaseFeeRate(Math.floor(baseFeeRate * 10000));
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

