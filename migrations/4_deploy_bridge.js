const Bridge = artifacts.require("Bridge");

module.exports = async function(deployer, network, addresses) {
  if (network === "test") {
    return;
  }

  let feeCollector;
  let admin;
  let validator;
  let feeOracle;

  switch (network) {
    case 'mainnet':
      feeCollector = process.env.FEE_COLLECTOR_ETH;
      admin = process.env.ADMIN_ETH;
      validator = process.env.VALIDATOR_ETH;
      feeOracle = process.env.FEE_ORACLE_ETH;
      break;
    case 'bsc':
      feeCollector = process.env.FEE_COLLECTOR_BSC;
      admin = process.env.ADMIN_BSC;
      validator = process.env.VALIDATOR_BSC;
      feeOracle = process.env.FEE_ORACLE_BSC;
      break;
    case 'heco':
      feeCollector = process.env.FEE_COLLECTOR_HECO;
      admin = process.env.ADMIN_HECO;
      validator = process.env.VALIDATOR_HECO;
      feeOracle = process.env.FEE_ORACLE_HECO;
      break;
    case 'polygon':
      feeCollector = process.env.FEE_COLLECTOR_POL;
      admin = process.env.ADMIN_POL;
      validator = process.env.VALIDATOR_POL;
      feeOracle = process.env.FEE_ORACLE_POL;
      break;
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

  if (!feeOracle) {
    throw new Error('Fee oracle not specified');
  }

  console.log('feeCollector', feeCollector);
  console.log('admin', admin);
  console.log('validator', validator);
  console.log('feeOracle', feeOracle);

  await deployer.deploy(Bridge, feeCollector, admin, validator, feeOracle);
};
