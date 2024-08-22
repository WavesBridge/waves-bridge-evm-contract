const WrappedToken = artifacts.require("WrappedToken");

module.exports = async function(deployer, network, addresses) {
  if (network === "test") {
    return;
  }

  function toBlockchainIdHex(str) {
    return web3.utils.padRight(web3.utils.asciiToHex(str), 8, '0')
  }

  const source = 'SOL'; // Example: SOL
  const sourceAddress = '0x069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001'; // In hex. Example: 0x069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001
  const decimals = '18'; // Example: 18
  const name = 'SOL'; // Example: Native SOL
  const symbol = 'SOL'; // Example: SOL
  const bridge = '0x19df3e9d0599CD25147ab6E9e15B6C5db8699C49'; // To set mint authority. Example: 0x4675A2f856efEB37d1e5f8c83d24202127F0B62d

  if (!source || !sourceAddress || !decimals || !name || !symbol || !bridge) {
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

// 0xd830eEccd9b5973cCE34A708Fba666f13f341f57
