const WrappedToken = artifacts.require("WrappedToken");

module.exports = async function(deployer, network, addresses) {
  if (network === "test") {
    return;
  }

  function toBlockchainIdHex(str) {
    return web3.utils.padRight(web3.utils.asciiToHex(str), 8, '0')
  }

  const source = '';
  const sourceAddress = '';
  const decimals = '';
  const name = '';
  const symbol = '';

  if (!source || !sourceAddress || !decimals || !name || !symbol) {
    throw new Error("Some value not specified");
  }
  console.log('source', source);
  console.log('sourceAddress', sourceAddress);
  console.log('decimals', decimals);
  console.log('name', name);
  console.log('symbol', symbol);

  await deployer.deploy(WrappedToken, toBlockchainIdHex(source), sourceAddress, decimals, name, symbol);
};
