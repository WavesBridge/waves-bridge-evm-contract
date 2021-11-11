const { FEE_ORACLE_ADDRESS} = require("./_script-const");
const {Big} = require('big.js');
const fs = require('fs');
const erc20Abi = JSON.parse(fs.readFileSync('../build/contracts/ERC20.json', 'UTF8')).abi;


const {question, pressAnyKey} = require("./_utils");
const FeeOracle = artifacts.require("FeeOracle");

module.exports = async (callback) => {
  try {
    const feeOracleAddress = await question('What Fee Oracle contract address do you want to use?', FEE_ORACLE_ADDRESS);
    const feeOracle = await FeeOracle.at(feeOracleAddress);
    const tokenAddress = await question('Token address', '');
    const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress);
    const decimals = await erc20Contract.methods.decimals().call();

    const fee = await question('Fee (float)', 0.01);
    const feeInt = Big(fee).times(Big(10).pow(+decimals)).toFixed();

    console.log(`You are going to change fee in fee oracle ${feeOracleAddress} from token ${tokenAddress} to ${fee} (${feeInt})`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await feeOracle.setMinFee(tokenAddress, feeInt);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

