import { TokenStatus, TokenType } from './utils';

const Bridge = artifacts.require('Bridge');
const Token = artifacts.require('Token');
const FeeOracle = artifacts.require('FeeOracle');
const {expectRevert} = require('@openzeppelin/test-helpers');

contract('Bridge', (accounts) => {
  it('success: fee oracle test', async () => {
    const feeManager = accounts[1];
    const bridge = await Bridge.deployed();
    const tokenManagerRole = await bridge.TOKEN_MANAGER();
    await bridge.grantRole(tokenManagerRole, feeManager);
    await bridge.setFeeOracle(accounts[8], {from: feeManager});
    expect(await bridge.feeOracle()).eq(accounts[8]);
    await bridge.revokeRole(tokenManagerRole, feeManager);
    await bridge.grantRole(tokenManagerRole, accounts[2]);
    await expectRevert(
      bridge.setFeeOracle(accounts[8], {from: feeManager}),
      'AccessControl'
    );
  });


  it('success: fee сollector test', async () => {
    const feeCollectorManager = accounts[1];
    const bridge = await Bridge.deployed();
    const tokenManagerRole = await bridge.TOKEN_MANAGER();
    await bridge.grantRole(tokenManagerRole, feeCollectorManager);
    await bridge.setFeeCollector(accounts[8], {from: feeCollectorManager});
    expect(await bridge.feeCollector()).eq(accounts[8]);
    await bridge.revokeRole(tokenManagerRole, feeCollectorManager);
    await bridge.grantRole(tokenManagerRole, accounts[2]);
    await expectRevert(
      bridge.setFeeOracle(accounts[8], {from: feeCollectorManager}),
      'AccessControl'
    );
  });

  it('success: token status test', async () => {
    const tokenStatusManager = accounts[1];
    const tokenManager = accounts[5];
    const bridge = await Bridge.deployed();
    const tokenManagerRole = await bridge.TOKEN_MANAGER();
    await bridge.grantRole(tokenManagerRole, tokenManager);
    const token = await Token.deployed();
    await bridge.addToken('0x00000001', token.address, token.address, TokenType.Native, {from: tokenManager});
    await bridge.grantRole(tokenManagerRole, tokenStatusManager);
    await bridge.setTokenStatus(token.address, TokenStatus.Disabled, {from: tokenStatusManager});
    expect(+(await bridge.tokenInfos(token.address) as any).tokenStatus).eq(TokenStatus.Disabled);
    await bridge.revokeRole(tokenManagerRole, tokenStatusManager);
    await bridge.grantRole(tokenManagerRole, accounts[2]);
    await expectRevert(
      bridge.setTokenStatus(token.address, TokenStatus.Enabled, {from: tokenStatusManager}),
      'AccessControl'
    );
    await bridge.removeToken('0x00000001', token.address, accounts[4], {from: tokenManager});
    await bridge.revokeRole(tokenManagerRole, tokenManager);
  });


  it('success: token manager test', async () => {
    const tokenManager = accounts[1];
    const bridge = await Bridge.deployed();
    const token = await Token.deployed();
    const tokenManagerRole = await bridge.TOKEN_MANAGER();
    await bridge.grantRole(tokenManagerRole, tokenManager);
    await bridge.addToken('0x00000001', token.address, token.address, TokenType.Native, {from: tokenManager});
    await bridge.removeToken('0x00000001', token.address, accounts[4], {from: tokenManager});
    expect(await bridge.feeCollector()).eq(accounts[8]);
    await bridge.revokeRole(tokenManagerRole, tokenManager);
    await bridge.grantRole(tokenManagerRole, accounts[2]);
    await expectRevert(
      bridge.addToken('0x00000002', token.address, token.address, TokenType.Native, {from: tokenManager}),
      'AccessControl'
    );
    await expectRevert(
      bridge.removeToken('0x00000002', token.address, accounts[4], {from: tokenManager}),
      'AccessControl'
    );
  });

  it('success: validator test', async () => {
    const validatorManager = accounts[1];
    const bridge = await Bridge.deployed();
    const bridgeManagerRole = await bridge.BRIDGE_MANAGER();
    await bridge.grantRole(bridgeManagerRole, validatorManager);
    await bridge.setValidator(accounts[8], {from: validatorManager});
    expect(await bridge.validator()).eq(accounts[8]);
    await bridge.revokeRole(bridgeManagerRole, validatorManager);
    await bridge.grantRole(bridgeManagerRole, accounts[2]);
    await expectRevert(
      bridge.setValidator(accounts[8], {from: validatorManager}),
      'AccessControl'
    );
  });

  it('success: bridge activity test', async () => {
    const startManager = accounts[1];
    const stopManager = accounts[4];
    const bridge = await Bridge.deployed();
    const bridgeManagerRole = await bridge.BRIDGE_MANAGER();
    const stopManagerRole = await bridge.STOP_MANAGER();
    await bridge.grantRole(bridgeManagerRole, startManager);
    await bridge.grantRole(stopManagerRole, stopManager);
    await bridge.startBridge({from: startManager});
    await bridge.stopBridge({from: stopManager});
    await expectRevert(bridge.startBridge({from: stopManager}), 'AccessControl');
    await expectRevert(bridge.stopBridge({from: startManager}), 'AccessControl');
    await bridge.revokeRole(bridgeManagerRole, startManager);
    await bridge.grantRole(bridgeManagerRole, accounts[2]);
    await bridge.revokeRole(stopManagerRole, stopManager);
    await bridge.grantRole(stopManagerRole, accounts[2]);
    await expectRevert(bridge.startBridge({from: startManager}), 'AccessControl');
    await expectRevert(bridge.stopBridge({from: stopManager}), 'AccessControl');
  });

  it('fail: stopped bridge', async () => {
    const bridge = await Bridge.deployed();
    const token = await Token.deployed();
    await expectRevert(
      bridge.lock('1', token.address, accounts[9], '0x01010101', '1'),
      'Bridge: is not active');
    await expectRevert(
      bridge.lockBase('1', token.address, token.address, '0x01010101', ),
      'Bridge: is not active');
    await expectRevert(
      bridge.unlock(1, accounts[9], '1', '0x01010101', '0x01010101', token.address, '0x0'),
      'Bridge: is not active');
  });

  it('success: fee oracle access', async () => {
    const feeOracle = await FeeOracle.new(web3.eth.accounts.create().address, '30', '2000000');
    await feeOracle.setFeeMultiplier(245);
    expect(+await feeOracle.feeMultiplier()).eq(245);

    const tokenAddress = web3.eth.accounts.create().address;
    await feeOracle.setMinFee(tokenAddress, 36);
    expect(+await feeOracle.minFee(tokenAddress)).eq(36);

    await feeOracle.setBaseFeeRate(24233);
    expect(+await feeOracle.baseFeeRateBP()).eq(24233);

    await expectRevert(
      feeOracle.setFeeMultiplier(245, {from: accounts[1]}),
      'Ownable'
    );

    await expectRevert(
      feeOracle.setMinFee(tokenAddress, 36, {from: accounts[1]}),
      'Ownable'
    );

    await expectRevert(
      feeOracle.setBaseFeeRate(24233, {from: accounts[1]}),
      'Ownable'
    );

  });
});
