const Bridge = artifacts.require("Bridge");

module.exports = async function(deployer, network, addresses) {
  if (network === "test") {
    return;
  }

  let feeCollector;
  let admin;
  let validator;

  switch (network) {
    case 'mainnet':
    case 'mainnet-fork':
      feeCollector = process.env.FEE_COLLECTOR_ETH;
      admin = process.env.ADMIN_ETH;
      validator = process.env.VALIDATOR_ETH;
      break;
    case 'bsc':
    case 'bsc-fork':
      feeCollector = process.env.FEE_COLLECTOR_BSC;
      admin = process.env.ADMIN_BSC;
      validator = process.env.VALIDATOR_BSC;
      break;
    case 'heco':
    case 'heco-fork':
      feeCollector = process.env.FEE_COLLECTOR_HECO;
      admin = process.env.ADMIN_HECO;
      validator = process.env.VALIDATOR_HECO;
      break;
    case 'polygon':
    case 'polygon-fork':
      feeCollector = process.env.FEE_COLLECTOR_POL;
      admin = process.env.ADMIN_POL;
      validator = process.env.VALIDATOR_POL;
      break;
    case 'avalanche':
    case 'avalanche-fork':
      feeCollector = process.env.FEE_COLLECTOR_AVA;
      admin = process.env.ADMIN_AVA;
      validator = process.env.VALIDATOR_AVA;
      break;
    case 'celo':
    case 'celo-fork':
      feeCollector = process.env.FEE_COLLECTOR_CELO;
      admin = process.env.ADMIN_CELO;
      validator = process.env.VALIDATOR_CELO;
      break;
    case 'kovan':
    case 'kovan-fork':
      feeCollector = process.env.FEE_COLLECTOR_KVN;
      admin = process.env.ADMIN_KVN;
      validator = process.env.VALIDATOR_KVN;
      break;
    case 'holesky':
    case 'holesky-fork':
      feeCollector = process.env.FEE_COLLECTOR_HOL;
      admin = process.env.ADMIN_HOL;
      validator = process.env.VALIDATOR_HOL;
      break;
    default:
      throw new Error("Network doesn't match")
  }

  if (!feeCollector) {
    throw new Error('Fee collector not specified');
  }

  if (!admin) {
    throw new Error('admin not specified');
  }
  if (!validator) {
    throw new Error('Validator not specified');
  }

  console.log('feeCollector', feeCollector);
  console.log('admin', admin);
  console.log('validator', validator);

  await deployer.deploy(Bridge, feeCollector, admin, validator);
};
