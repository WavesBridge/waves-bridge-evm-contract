import { TokenType } from './utils';

const Bridge = artifacts.require("Bridge");
const Token = artifacts.require("Token");
const { expectRevert } = require('@openzeppelin/test-helpers');

contract('Bridge', (accounts) => {
  it('success: fee oracle test', async () => {
    const feeManager = accounts[1];
    const bridge = await Bridge.deployed();
    const feeOracleManagerRole = await bridge.FEE_ORACLE_MANAGER()
    await bridge.grantRole(feeOracleManagerRole, feeManager);
    await bridge.setFeeOracle(accounts[8], {from: feeManager});
    expect(await bridge.feeOracle()).eq(accounts[8]);
    await bridge.revokeRole(feeOracleManagerRole, feeManager);
    await bridge.grantRole(feeOracleManagerRole, accounts[2]);
    await expectRevert(
      bridge.setFeeOracle(accounts[8], {from: feeManager}),
      "AccessControl"
    );
  });



  it('success: fee oracle test', async () => {
    const feeCollectorManager = accounts[1];
    const bridge = await Bridge.deployed();
    const feeCollectorManagerRole = await bridge.FEE_COLLECTOR_MANAGER()
    await bridge.grantRole(feeCollectorManagerRole, feeCollectorManager);
    await bridge.setFeeCollector(accounts[8], {from: feeCollectorManager});
    expect(await bridge.feeCollector()).eq(accounts[8]);
    await bridge.revokeRole(feeCollectorManagerRole, feeCollectorManager);
    await bridge.grantRole(feeCollectorManagerRole, accounts[2]);
    await expectRevert(
      bridge.setFeeOracle(accounts[8], {from: feeCollectorManager}),
      "AccessControl"
    );
  });


  it('success: token manager test', async () => {
    const tokenManager = accounts[1];
    const bridge = await Bridge.deployed();
    const token = await Token.deployed();
    const tokenManagerRole = await bridge.TOKEN_MANAGER()
    await bridge.grantRole(tokenManagerRole, tokenManager);
    await bridge.addToken('0x00000001', token.address, token.address, TokenType.Native, {from: tokenManager});
    await bridge.removeToken('0x00000001', token.address, accounts[4], {from: tokenManager});
    expect(await bridge.feeCollector()).eq(accounts[8]);
    await bridge.revokeRole(tokenManagerRole, tokenManager);
    await bridge.grantRole(tokenManagerRole, accounts[2]);
    await expectRevert(
      bridge.addToken('0x00000002', token.address, token.address, TokenType.Native, {from: tokenManager}),
      "AccessControl"
    );
    await expectRevert(
      bridge.removeToken('0x00000002', token.address, accounts[4], {from: tokenManager}),
      "AccessControl"
    );
  });

  it('success: validator test', async () => {
    const validatorManager = accounts[1];
    const bridge = await Bridge.deployed();
    const validatorManagerRole = await bridge.VALIDATOR_MANAGER()
    await bridge.grantRole(validatorManagerRole, validatorManager);
    await bridge.setValidator(accounts[8], {from: validatorManager});
    expect(await bridge.validator()).eq(accounts[8]);
    await bridge.revokeRole(validatorManagerRole, validatorManager);
    await bridge.grantRole(validatorManagerRole, accounts[2]);
    await expectRevert(
      bridge.setValidator(accounts[8], {from: validatorManager}),
      "AccessControl"
    );
  });

  it('success: bridge activity test', async () => {
    const startManager = accounts[1];
    const stopManager = accounts[4];
    const bridge = await Bridge.deployed();
    const startManagerRole = await bridge.START_MANAGER();
    const stopManagerRole = await bridge.STOP_MANAGER();
    await bridge.grantRole(startManagerRole, startManager);
    await bridge.grantRole(stopManagerRole, stopManager);
    await bridge.startBridge({from: startManager});
    await bridge.stopBridge({from: stopManager});
    await expectRevert(bridge.startBridge({from: stopManager}), "AccessControl");
    await expectRevert(bridge.stopBridge({from: startManager}), "AccessControl");
    await bridge.revokeRole(startManagerRole, startManager);
    await bridge.grantRole(startManagerRole, accounts[2]);
    await bridge.revokeRole(stopManagerRole, stopManager);
    await bridge.grantRole(stopManagerRole, accounts[2]);
    await expectRevert(bridge.startBridge({from: startManager}), "AccessControl");
    await expectRevert(bridge.stopBridge({from: stopManager}), "AccessControl");
  });

  it('fail: stopped bridge', async () => {
    const bridge = await Bridge.deployed();
    const token = await Token.deployed();
    await expectRevert(
      bridge.lock(token.address, '1', accounts[9], '0x01010101'),
      "Bridge: is not active");
    await expectRevert(
      bridge.lockBase(token.address, '0x01010101', token.address),
      "Bridge: is not active");
    await expectRevert(
      bridge.unlock(1, accounts[9], '1',  '0x01010101', '0x01010101', token.address, '0x0'),
      "Bridge: is not active");
  });
});
