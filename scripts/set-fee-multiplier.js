const { FEE_ORACLE_ADDRESS} = require("./_script-const");

const {question, pressAnyKey} = require("./_utils");
const FeeOracle = artifacts.require("FeeOracle");

module.exports = async (callback) => {
  try {
    const feeOracleAddress = await question('What Bridge contract address do you want to use?', FEE_ORACLE_ADDRESS);
    const feeOracle = await FeeOracle.at(feeOracleAddress);
    const feeMultiplier = await question('Fee multiplier', '');

    console.log(`You are going to set fee multiplier to ${feeMultiplier} from fee oracle ${feeOracleAddress}`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await feeOracle.setFeeMultiplier(feeMultiplier);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

