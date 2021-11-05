const {question, pressAnyKey} = require("./_utils");
const WrappedToken = artifacts.require("WrappedToken");

module.exports = async (callback) => {
  try {
    const tokenAddress = await question('Token address', '');
    const newOwner = await question('new owner', '');
    const wrappedToken = await WrappedToken.at(tokenAddress);
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await wrappedToken.transferOwnership(newOwner)
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

