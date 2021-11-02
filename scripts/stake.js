const {STAKING_ADDRESS, ABR_ADDRESS} = require("./_script-const");
const fs = require('fs');
const erc20Abi = JSON.parse(fs.readFileSync('../build/contracts/ERC20.json', 'UTF8')).abi;

const {question, pressAnyKey} = require("./_utils");
const Staking = artifacts.require("Staking");

module.exports = async (callback) => {
  try {
    const sender = (await web3.eth.getAccounts())[0];
    const stakingAddress = await question('What Staking pool contract address do you want to use?', STAKING_ADDRESS);
    const staking = await Staking.at(stakingAddress);
    const amount = await question('Stake amount', '');

    const erc20Contract = new web3.eth.Contract(erc20Abi, ABR_ADDRESS);
    await erc20Contract.methods.approve(stakingAddress, amount).send({from: sender});

    console.log(`You are going to stake ${amount} ABR on staking pool ${stakingAddress}`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await staking.deposit(amount);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

