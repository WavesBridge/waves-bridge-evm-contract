const Pool = artifacts.require("Pool");

module.exports = async function(deployer, network, addresses) {
  if (network === "test") {
    return;
  }

  let rewardToken;
  let rewardPerBlock;
  let startBlock;

  switch (network) {
    case 'mainnet':
      rewardToken = process.env.REWARD_TOKEN_ETH;
      rewardPerBlock = process.env.REWARD_PER_BLOCK_ETH
      startBlock = process.env.START_BLOCK_ETH;
      break;
    case 'bsc':
      rewardToken = process.env.REWARD_TOKEN_BSC;
      rewardPerBlock = process.env.REWARD_PER_BLOCK_BSC
      startBlock = process.env.START_BLOCK_BSC;
      break;
    case 'heco':
      rewardToken = process.env.REWARD_TOKEN_HECO;
      rewardPerBlock = process.env.REWARD_PER_BLOCK_HECO
      startBlock = process.env.START_BLOCK_HECO;
      break;
    case 'polygon':
      rewardToken = process.env.REWARD_TOKEN_POL;
      rewardPerBlock = process.env.REWARD_PER_BLOCK_POL
      startBlock = process.env.START_BLOCK_POL;
      break;
  }

  if (!rewardToken) {
    throw new Error('Reward token not specified');
  }

  if (!rewardPerBlock) {
    throw new Error('Reward per block not specified');
  }

  if (!startBlock) {
    throw new Error('Start block not specified');
  }

  console.log('rewardToken', rewardToken);
  console.log('rewardPerBlock', rewardPerBlock);
  console.log('startBlock', startBlock);

  await deployer.deploy(Pool, rewardToken, rewardPerBlock, startBlock);
};
