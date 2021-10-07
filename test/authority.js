const Bridge = artifacts.require("Bridge");
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Bridge', (accounts) => {
  it('success: flow', async () => {
    const feeManager = accounts[1];
    const bridge = await Bridge.deployed();
    await bridge.grantRole(await bridge.FEE_MANAGER(), feeManager);
    await bridge.setFeeManager(accounts[8], {from: feeManager});
    assert(await bridge.feeManager(), accounts[8]);
    await bridge.revokeRole(await bridge.FEE_MANAGER(), feeManager);
    await bridge.grantRole(await bridge.FEE_MANAGER(), accounts[2]);
    await expectRevert(
      bridge.setFeeManager(accounts[8], {from: feeManager}),
      "AccessControl"
    );
  });
});
