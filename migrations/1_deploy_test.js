const Bridge = artifacts.require("Bridge");
const Token = artifacts.require("Token");
const Validator = artifacts.require("MockValidator");

module.exports = async function(deployer, network, addresses) {
  let validator;
  let admin = addresses[0];
  if (network === "test") {
    await deployer.deploy(Token, "Test ABR", "tABR", web3.utils.toWei('1000'));
    await deployer.deploy(Validator);
    validator = (await Validator.deployed()).address;
    await deployer.deploy(Bridge, admin, admin, validator);
  }
};
