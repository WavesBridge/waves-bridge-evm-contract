const Pool = artifacts.require("Pool");
const Token = artifacts.require("Token");
const Bridge = artifacts.require("Bridge");
const Validator = artifacts.require("MockValidator");
const FeeOracle = artifacts.require("MockFeeOracle");

module.exports = async function(deployer, network, addresses) {
  let baseToken;
  let validator;
  let feeOracle;
  let admin = addresses[0];
  if (network == "test") {
    await deployer.deploy(Token, "Test Token", "TST", web3.utils.toWei('1000000'));
    baseToken = (await Token.deployed()).address;
    await deployer.deploy(FeeOracle);
    feeOracle = (await FeeOracle.deployed()).address;
    await deployer.deploy(Validator);
    validator = (await Validator.deployed()).address;
    await deployer.deploy(Bridge, web3.utils.asciiToHex("RPS"), admin, admin, validator, feeOracle);

  } else {
    baseToken = process.env.POOL_BASE_TOKEN;
  }
  console.log(`Deploying pool for ${baseToken}`);
  // await deployer.deploy(Pool, baseToken);
};
