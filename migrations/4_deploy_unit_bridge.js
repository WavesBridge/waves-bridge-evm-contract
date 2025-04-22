const Unit0BridgeProxy = artifacts.require("Unit0BridgeProxy");

module.exports = async function(deployer, network, addresses) {
  if (network === "test") {
    return;
  }

  let feeCollector;
  let unitNativeBridge;
  let unitStandardBridge;

  switch (network) {
    case 'unit0':
    case 'unit0-fork':
      feeCollector = process.env.FEE_COLLECTOR_UNIT;
      unitNativeBridge = '0x0000000000000000000000000000000000006A7e';
      unitStandardBridge = '';
      break;
    case 'unit0Test':
    case 'unit0Test-fork':
      feeCollector = process.env.FEE_COLLECTOR_UNIT_TEST;
      unitNativeBridge = '0x0000000000000000000000000000000000006A7e';
      unitStandardBridge = '0x2EE5715961C45bd16EB5c2739397B8E871A46F9f';
      break;
    default:
      throw new Error("Network doesn't match")
  }

  if (!feeCollector) {
    throw new Error('Fee collector not specified');
  }

  if (!unitNativeBridge) {
    throw new Error('unitNativeBridge not specified');
  }
  if (!unitStandardBridge) {
    throw new Error('unitStandardBridge not specified');
  }

  console.log('feeCollector', feeCollector);
  console.log('unitNativeBridge', unitNativeBridge);
  console.log('unitStandardBridge', unitStandardBridge);

  await deployer.deploy(Unit0BridgeProxy, feeCollector, unitNativeBridge, unitStandardBridge);
};
