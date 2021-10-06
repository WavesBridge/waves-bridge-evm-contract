const Pool = artifacts.require("Pool");
const Token = artifacts.require("Token");

module.exports = async function(deployer, network) {
  let baseToken;
  if (network == "test") {
    await deployer.deploy(Token, "Test Token", "TST");
    baseToken = (await Token.deployed()).address;
  } else {
    baseToken = process.env.POOL_BASE_TOKEN;
  }
  console.log(`Deploying pool for ${baseToken}`);
  await deployer.deploy(Pool, baseToken);
};
