const Staking = artifacts.require("Staking");

module.exports = async function(deployer, network, addresses) {
  console.log("Network", network);
  if (network === "test") {
    return;
  }

  let baseToken;

  switch (network) {
    case 'mainnet':
      baseToken = process.env.BASE_TOKEN_ETH;
      break;
    case 'bsc':
      baseToken = process.env.BASE_TOKEN_BSC;
      break;
    case 'heco':
      baseToken = process.env.BASE_TOKEN_HECO;
      break;
    case 'polygon':
      baseToken = process.env.BASE_TOKEN_POL;
      break;
    case 'kovan-fork':
    case 'kovan':
      baseToken = process.env.BASE_TOKEN_KVN;
      break;
    default:
      throw new Error("Network doesn't match")
  }

  if (!baseToken) {
    throw new Error('Base token is not specified');
  }

  console.log('baseToken', baseToken);

  await deployer.deploy(Staking, baseToken);
};
