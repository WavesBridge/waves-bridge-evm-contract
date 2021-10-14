const FeeOracle = artifacts.require("FeeOracle");

module.exports = async function(deployer, network, addresses) {
  if (network === "test") {
    return;
  }

  let pool;
  let baseFeeRateBP;

  switch (network) {
    case 'mainnet':
      pool = process.env.POOL_ETH;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_ETH;
      break;
    case 'bsc':
      pool = process.env.POOL_BSC;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_BSC;
      break;
    case 'heco':
      pool = process.env.POOL_HECO;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_HECO;
      break;
    case 'polygon':
      pool = process.env.POOL_POL;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_POL;
      break;
  }

  if (!pool) {
    throw new Error('Pool not specified');
  }

  if (!baseFeeRateBP) {
    throw new Error('Fee rate not specified');
  }


  console.log('pool', pool);
  console.log('baseFeeRateBP', baseFeeRateBP);

  await deployer.deploy(FeeOracle, pool, baseFeeRateBP);
};
