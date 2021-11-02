const {BRIDGE_ADDRESS} = require("./_script-const");
const {Big} = require('big.js');
const fs = require('fs');
const erc20Abi = JSON.parse(fs.readFileSync('../build/contracts/ERC20.json', 'UTF8')).abi;
const {asciiToHex, toBN} = web3.utils;


const {question, pressAnyKey} = require("./_utils");
const Bridge = artifacts.require("Bridge");

module.exports = async (callback) => {
  try {
    const bridgeAddress = await question('What Bridge contract address do you want to use?', BRIDGE_ADDRESS);
    const bridge = await Bridge.at(bridgeAddress);
    const tokenAddress = await question('Token source address (hex 0x...)', '0x2791bca1f2de4661ed88a30c99a7a9449aa84174');
    const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress);
    const amount = await question('Amount (float)', '30');
    const destination = await question('Destination', 'SOL');
    const recipient = await question('Recipient (hex 0x...)', '0x3ce641702a6be6401c7627d5a76acab18bdc7114a7b2ae48b137f5d99d503d11');

    const decimals = await erc20Contract.methods.decimals().call();
    const symbol = await erc20Contract.methods.symbol().call();
    const name = await erc20Contract.methods.name().call();
    const amountInt = Big(+amount).times(Big(10).pow(+decimals)).toFixed();
    const sender = (await web3.eth.getAccounts())[0];

    const allowance = await erc20Contract.methods.allowance(sender, bridgeAddress).call();
    if (toBN(allowance).lt(toBN(amountInt))) {
      console.log('You need to approve');
      await pressAnyKey();
      console.log(`Approving...`);
      const approveTx = await erc20Contract.methods.approve(bridgeAddress, amountInt).send({from: sender});
      console.log('Success', approveTx.transactionHash);
    }

    console.log(`You are going to send ${amount} ${symbol} (${name}) to ${destination} for ${recipient}`);
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await bridge.lock(tokenAddress, amountInt, recipient, asciiToHex(destination));
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

