const Pool = artifacts.require("Pool");
const Token = artifacts.require("Token");
const Bridge = artifacts.require("Bridge");

module.exports = async function(deployer, network, addresses) {
  let baseToken;
  let admin = addresses[0];
  if (network == "test") {
    await deployer.deploy(Token, "Test Token", "TST");
    baseToken = (await Token.deployed()).address;
    await deployer.deploy(Bridge, web3.utils.asciiToHex("RPS"), admin, admin, admin, admin);

  } else {
    baseToken = process.env.POOL_BASE_TOKEN;
  }
  console.log(`Deploying pool for ${baseToken}`);
  await deployer.deploy(Pool, baseToken);
};
