const Bridge = artifacts.require("Bridge");
const Token = artifacts.require("Token");
const Validator = artifacts.require("MockValidator");
const MockFeeOracle = artifacts.require("MockFeeOracle");

module.exports = async function(deployer, network, addresses) {
  let validator;
  let feeOracle;
  let admin = addresses[0];
  if (network == "test") {
    await deployer.deploy(Token, "Test ABR", "tABR", web3.utils.toWei('1000000'));
    await deployer.deploy(MockFeeOracle);
    feeOracle = (await MockFeeOracle.deployed()).address;
    await deployer.deploy(Validator);
    validator = (await Validator.deployed()).address;
    const unlockSigner = addresses[8];
    await deployer.deploy(Bridge, admin, admin, validator, feeOracle, unlockSigner);
  }
};
