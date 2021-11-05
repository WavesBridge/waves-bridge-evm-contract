const WrappedToken = artifacts.require("WrappedToken");

module.exports = async function(deployer, network, addresses) {
  if (network === "test") {
    return;
  }

  function toBlockchainIdHex(str) {
    return web3.utils.padRight(web3.utils.asciiToHex(str), 8, '0')
  }

  const source = ''; // Example: SOL
  const sourceAddress = ''; // In hex. Example: 0x069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001
  const decimals = ''; // Example: 18
  const name = ''; // Example: Native SOL
  const symbol = ''; // Example: SOL
  const bridge = ''; // To set mint authority. Example: 0x4675A2f856efEB37d1e5f8c83d24202127F0B62d

  if (!source || !sourceAddress || !decimals || !name || !symbol) {
    throw new Error("Some value not specified");
  }
  console.log('source', source);
  console.log('sourceAddress', sourceAddress);
  console.log('decimals', decimals);
  console.log('name', name);
  console.log('symbol', symbol);

  await deployer.deploy(WrappedToken, toBlockchainIdHex(source), sourceAddress, decimals, name, symbol);
  const token = await WrappedToken.deployed();
  await token.transferOwnership(bridge);
};

// 0xE2dbccB6F46Ea553820Aa5eD672e1E3ee24B8386
