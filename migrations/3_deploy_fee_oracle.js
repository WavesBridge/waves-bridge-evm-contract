const FeeOracle = artifacts.require("FeeOracle");

module.exports = async function(deployer, network, addresses) {
  if (network === "test") {
    return;
  }

  let pool;
  let baseFeeRateBP;
  let feeMultiplier;

  switch (network) {
    case 'mainnet':
    case 'mainnet-fork':
      pool = process.env.POOL_ETH;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_ETH;
      feeMultiplier = process.env.FEE_MULTIPLIER_ETH;
      break;
    case 'bsc':
    case 'bsc-fork':
      pool = process.env.POOL_BSC;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_BSC;
      feeMultiplier = process.env.FEE_MULTIPLIER_BSC;
      break;
    case 'heco':
    case 'heco-fork':
      pool = process.env.POOL_HECO;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_HECO;
      feeMultiplier = process.env.FEE_MULTIPLIER_HECO;
      break;
    case 'polygon':
    case 'polygon-fork':
      pool = process.env.POOL_POL;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_POL;
      feeMultiplier = process.env.FEE_MULTIPLIER_POL;
      break;
    case 'avalanche':
    case 'avalanche-fork':
      pool = process.env.POOL_AVA;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_AVA;
      feeMultiplier = process.env.FEE_MULTIPLIER_AVA;
      break;
    case 'celo':
    case 'celo-fork':
      pool = process.env.POOL_CELO;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_CELO;
      feeMultiplier = process.env.FEE_MULTIPLIER_CELO;
      break;
    case 'kovan':
    case 'kovan-fork':
      pool = process.env.POOL_KVN;
      baseFeeRateBP = process.env.BASE_FEE_RATE_BP_KVN;
      feeMultiplier = process.env.FEE_MULTIPLIER_KVN;

      break;
    default:
      throw new Error("Network doesn't match")
  }

  if (!pool) {
    throw new Error('Pool not specified');
  }

  if (!baseFeeRateBP) {
    throw new Error('Fee rate not specified');
  }

  if (!feeMultiplier) {
    throw new Error('Fee multiplier not specified');
  }


  console.log('pool', pool);
  console.log('baseFeeRateBP', baseFeeRateBP);
  console.log('feeMultiplier', feeMultiplier);

  await deployer.deploy(FeeOracle, pool, baseFeeRateBP, feeMultiplier);
};
