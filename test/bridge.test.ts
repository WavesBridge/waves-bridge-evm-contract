import {
  BridgeInstance,
  MockFeeOracleInstance,
  MockValidatorInstance,
  TokenInstance,
  WrappedTokenInstance
} from '../types';
import { Helper, TokenStatus, TokenType } from './utils';
import { expectEvent, expectRevert } from '@openzeppelin/test-helpers';

const {toBN, asciiToHex, padRight, toWei} = web3.utils;
const Bridge = artifacts.require('Bridge');
const WrappedToken = artifacts.require('WrappedToken');
const Token = artifacts.require('Token');
const Validator = artifacts.require('MockValidator');
const FeeOracle = artifacts.require('MockFeeOracle');

const ZERO_BLOCKHAIN_ID = '0x00000000';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const gasPrice = 20000000000;

contract('Bridge: common flow', (accounts) => {
  let helper: Helper;
  let bridgeA: BridgeInstance;
  let bridgeB: BridgeInstance;
  let validator: MockValidatorInstance;
  let feeOracle: MockFeeOracleInstance;
  let token: TokenInstance;
  let wrappedTokenA: WrappedTokenInstance;
  let wrappedTokenB: WrappedTokenInstance;
  const recipientB = accounts[2];
  const recipientA = accounts[3];
  const feeCollector = accounts[4];
  const amount = toWei('100');
  const fee = toWei('0.1');
  const amountWithFee = toBN(amount).add(toBN(fee)).toString();
  const amountSubFee = toBN(amount).sub(toBN(fee)).toString();
  const payer = accounts[0];
  const A_NETWORK = 'GRL';
  const A_NETWORK_HEX = padRight(asciiToHex(A_NETWORK), 8);
  const B_NETWORK = 'RPS';
  const B_NETWORK_HEX = padRight(asciiToHex(B_NETWORK), 8);
  const wrappedTokenSourceAddress = web3.eth.accounts.create().address;
  const unlockSigner = accounts[8];

  before(async () => {
    wrappedTokenB = await WrappedToken.new(B_NETWORK_HEX, wrappedTokenSourceAddress, 18, 'Wrapped', 'WRP');
    wrappedTokenA = await WrappedToken.new(A_NETWORK_HEX, wrappedTokenSourceAddress, 18, 'Wrapped', 'WRP');
    validator = await Validator.deployed();
    feeOracle = await FeeOracle.deployed();
    bridgeA = await Bridge.new(feeCollector, payer, validator.address, feeOracle.address, unlockSigner);
    bridgeB = await Bridge.new(feeCollector, payer, validator.address, feeOracle.address, unlockSigner);
    token = await Token.new('token', 'TKN', toWei('1000000'));
    helper = new Helper(bridgeA, token);
    await wrappedTokenA.transferOwnership(bridgeA.address);
    await wrappedTokenB.transferOwnership(bridgeB.address);
  });

  it('Fail: Add token (not owner)', async () => {
    await expectRevert(
      bridgeA.addToken(A_NETWORK_HEX, token.address, token.address, TokenType.Native),
      'AccessControl'
    );
  });

  it('Success: set roles', async () => {
    const tokenManagerRole = await bridgeA.TOKEN_MANAGER();
    const bridgeManagerRole = await bridgeA.BRIDGE_MANAGER();
    await bridgeA.grantRole(tokenManagerRole, payer);
    await bridgeB.grantRole(tokenManagerRole, payer);
    await bridgeA.grantRole(bridgeManagerRole, payer);
    await bridgeB.grantRole(bridgeManagerRole, payer);
    expect(await bridgeA.hasRole(tokenManagerRole, payer)).eq(true);
    expect(await bridgeB.hasRole(tokenManagerRole, payer)).eq(true);
    expect(await bridgeA.hasRole(bridgeManagerRole, payer)).eq(true);
    expect(await bridgeB.hasRole(bridgeManagerRole, payer)).eq(true);
  });

  it('Success: activate bridge', async () => {
    await bridgeA.startBridge();
    await bridgeB.startBridge();
  });


  it('Fail: Lock (token not found)', async () => {
    await token.approve(bridgeA.address, MAX_UINT256);

    await expectRevert(
      bridgeA.lock('1', token.address, recipientB, B_NETWORK_HEX, '10'),
      'Bridge: unsupported token'
    );

    await token.approve(bridgeA.address, '0');

  });

  it('Success: Add token to A', async () => {
    await bridgeA.addToken(A_NETWORK_HEX, token.address, token.address, TokenType.Native);
    const localTokenInfo = await bridgeA.tokenInfos(token.address);
    expect(localTokenInfo).deep.include({
      tokenSource: A_NETWORK_HEX,
      tokenSourceAddress: helper.addressToBytes32(token.address),
      precision: await token.decimals(),
      tokenType: toBN(TokenType.Native)
    });

    expect(await bridgeA.tokenSourceMap(A_NETWORK_HEX, token.address)).eq(token.address);
  });

  it('Success: Add wrapped token to A', async () => {
    await bridgeA.addToken(A_NETWORK_HEX, wrappedTokenSourceAddress, wrappedTokenA.address, TokenType.Wrapped);
    const localTokenInfo = await bridgeA.tokenInfos(wrappedTokenA.address);
    expect(localTokenInfo).deep.include({
      tokenSource: A_NETWORK_HEX,
      tokenSourceAddress: helper.addressToBytes32(wrappedTokenSourceAddress),
      precision: await wrappedTokenA.decimals(),
      tokenType: toBN(TokenType.Wrapped)
    });

    expect(await bridgeA.tokenSourceMap(A_NETWORK_HEX, wrappedTokenSourceAddress)).eq(wrappedTokenA.address);
  });

  it('Fail: Add token (already exists)', async () => {
    await expectRevert(
      bridgeA.addToken(A_NETWORK_HEX, wrappedTokenSourceAddress, wrappedTokenA.address, TokenType.Wrapped),
      'Bridge: exists'
    );
  });

  it('Success: Add wrapped token to B', async () => {
    await bridgeB.addToken(A_NETWORK_HEX, token.address, wrappedTokenB.address, TokenType.Wrapped);
    const localTokenInfo = await bridgeB.tokenInfos(wrappedTokenB.address);
    expect(localTokenInfo).deep.include({
      tokenSource: A_NETWORK_HEX,
      tokenSourceAddress: helper.addressToBytes32(token.address),
      precision: await wrappedTokenB.decimals(),
      tokenType: toBN(TokenType.Wrapped)
    });

    expect(await bridgeB.tokenSourceMap(A_NETWORK_HEX, token.address)).eq(wrappedTokenB.address);
  });

  it('Fail: Wrapped token mint', async () => {
    await expectRevert(
      wrappedTokenB.mint(payer, '1'),
      'Ownable'
    );
  });

  it('Fail: Lock (not approved)', async () => {
    await expectRevert(
      bridgeA.lock('1', token.address, recipientB, B_NETWORK_HEX, amountWithFee),
      'ERC20: transfer amount exceeds allowance'
    );
  });

  it('Fail: Lock (not enough balance)', async () => {
    const userBalance = await token.balanceOf(payer);
    await token.approve(bridgeA.address, MAX_UINT256);

    await expectRevert(
      bridgeA.lock('1', token.address, recipientB, B_NETWORK_HEX, userBalance.add(toBN(1))),
      'ERC20: transfer amount exceeds balance'
    );
    await token.approve(bridgeA.address, '0');
  });

  it('Fail: Lock (amount too small)', async () => {
    await token.approve(bridgeA.address, MAX_UINT256);

    await expectRevert(
      bridgeA.lock('1', token.address, recipientB, B_NETWORK_HEX, toBN(fee)),
      'Bridge: amount too small'
    );
    await token.approve(bridgeA.address, '0');
  });

  it('Success: Lock', async () => {
    const userBalanceBefore = await token.balanceOf(payer);
    let lockId = toBN(0);
    await token.approve(bridgeA.address, amountWithFee);
    const lockTx = await bridgeA.lock(lockId, token.address, recipientB, B_NETWORK_HEX, amountWithFee);

    expectEvent(lockTx, 'Sent', {
      tokenSource: A_NETWORK_HEX,
      tokenSourceAddress: helper.addressToBytes32(token.address),
      recipient: helper.addressToBytes32(recipientB),
      amount,
      lockId,
      destination: B_NETWORK_HEX
    });
    (await helper.expectTokenBalance(bridgeA.address)).eq(amount);
    (await helper.expectTokenBalance(payer)).eq(userBalanceBefore.sub(toBN(amountWithFee)).toString());
    (await helper.expectTokenBalance(feeCollector)).eq(fee);
  });

  it('Success: Unlock native', async () => {
    const lockId = '4';
    const hexSource = padRight(asciiToHex(A_NETWORK), 8);
    const sourceAddress = token.address;

    const amountWithSystemPrecision = toBN(amount).div(toBN(1e9)).toString();
    const signature = '0x0';

    const wrapTx = await bridgeB.unlock(lockId, recipientB, amountWithSystemPrecision, hexSource, hexSource, sourceAddress, signature);

    expectEvent(wrapTx, 'Received', {
      recipient: recipientB,
      token: wrappedTokenB.address,
      amount,
      lockId,
      source: hexSource
    });

    const recipientBalance = await wrappedTokenB.balanceOf(recipientB);
    expect(recipientBalance.toString()).eq(amount);
  });

  it('Fail: Unlock', async () => {
    const lockId = '4';
    const hexSource = padRight(asciiToHex(A_NETWORK), 8);
    const sourceAddress = token.address;

    await validator.setReturnError(true);

    const amountWithSystemPrecision = toBN(amount).div(toBN(1e9)).toString();
    const signature = '0x0';

    await expectRevert(
      bridgeB.unlock(lockId, recipientB, amountWithSystemPrecision, hexSource, hexSource, sourceAddress, signature),
      'Bridge: validation failed'
    );
    await validator.setReturnError(false);

  });

  it('Fail: Wrap (token not found)', async () => {
    const lockId = '6';
    const hexSource = padRight(asciiToHex(A_NETWORK), 8);
    const sourceAddress = web3.eth.accounts.create().address;

    const amountWithSystemPrecision = toBN(amount).div(toBN(1e9)).toString();
    const signature = '0x0';

    await expectRevert(
      bridgeB.unlock(lockId, recipientB, amountWithSystemPrecision, hexSource, hexSource, sourceAddress, signature),
      'Bridge: unsupported token'
    );
  });

  it('Success: Lock wrapped', async () => {
    const lockId = '1';

    await wrappedTokenB.approve(bridgeB.address, fee, {from: recipientB});

    const lockTx = await bridgeB.lock(lockId, wrappedTokenB.address, recipientA, A_NETWORK_HEX, amount, {from: recipientB});
    expect((await wrappedTokenB.balanceOf(recipientB)).toString()).eq('0');
    expect((await wrappedTokenB.balanceOf(feeCollector)).toString()).eq(fee);

    expectEvent(lockTx, 'Sent', {
      tokenSource: A_NETWORK_HEX,
      tokenSourceAddress: helper.addressToBytes32(token.address),
      recipient: helper.addressToBytes32(recipientA),
      amount: amountSubFee,
      lockId,
      destination: A_NETWORK_HEX
    });
  });

  it('Success: Unlock wrapped', async () => {
    const lockId = '6';
    const hexSource = padRight(asciiToHex(B_NETWORK), 8);
    const tokenAddress = token.address;
    const amountWithSystemPrecision = toBN(amount).div(toBN(1e9)).toString();

    const signature = '0x0';

    const unlockTx = await bridgeA.unlock(lockId, recipientA, amountWithSystemPrecision, hexSource, helper.networkToHex(A_NETWORK), tokenAddress, signature);

    expectEvent(unlockTx, 'Received', {
      recipient: recipientA,
      token: tokenAddress,
      amount: amount,
      lockId,
      source: B_NETWORK_HEX
    });

    (await helper.expectTokenBalance(bridgeA.address)).eq('0');
    (await helper.expectTokenBalance(recipientA)).eq(amount);
    (await helper.expectTokenBalance(feeCollector)).eq(fee);
  });

  it ('Fail: lock disabled token', async () => {
    await bridgeA.setTokenStatus(token.address, TokenStatus.Disabled);
    await token.approve(bridgeA.address, amountWithFee);
    await expectRevert(
      bridgeA.lock('1', token.address, recipientB, B_NETWORK_HEX, amountWithFee),
      'Bridge: disabled token'
    );
    await bridgeA.setTokenStatus(token.address, TokenStatus.Enabled);
  })

  it('Success: Remove native token', async () => {
    const newAuthority = accounts[9];
    await token.transfer(bridgeA.address, '5');
    const tokenBalance = await token.balanceOf(bridgeA.address);
    await bridgeA.removeToken(A_NETWORK_HEX, token.address, newAuthority);
    const tokenInfo = await bridgeA.tokenInfos(token.address);
    expect(tokenInfo).deep.include({
      tokenSource: ZERO_BLOCKHAIN_ID,
      tokenSourceAddress: ZERO_BYTES32,
      precision: toBN(0),
      tokenType: toBN(0)
    });

    expect(await bridgeA.tokenSourceMap(A_NETWORK_HEX, token.address)).eq(ZERO_ADDRESS);

    expect((await token.balanceOf(bridgeA.address)).toString()).eq('0');
    expect((await token.balanceOf(newAuthority)).toString()).eq(tokenBalance.toString());
  });

  it('Success: Remove wrapped token', async () => {
    const newAuthority = accounts[9];
    const tokenBalance = await wrappedTokenB.balanceOf(bridgeB.address);
    await bridgeB.removeToken(A_NETWORK_HEX, token.address, newAuthority);
    const tokenInfo = await bridgeB.tokenInfos(wrappedTokenB.address);
    expect(tokenInfo).deep.include({
      tokenSource: ZERO_BLOCKHAIN_ID,
      tokenSourceAddress: ZERO_BYTES32,
      precision: toBN(0),
      tokenType: toBN(0)
    });

    expect(await bridgeB.tokenSourceMap(A_NETWORK_HEX, token.address)).eq(ZERO_ADDRESS);

    expect((await wrappedTokenB.balanceOf(bridgeB.address)).toString()).eq('0');
    expect((await wrappedTokenB.balanceOf(newAuthority)).toString()).eq(tokenBalance.toString());
    expect((await wrappedTokenB.owner()).toString()).eq(newAuthority);
  });
});

contract('Bridge: WETH', (accounts) => {
  let helper: Helper;
  let bridgeA: BridgeInstance;
  let token: TokenInstance;
  let validator: MockValidatorInstance;
  let feeOracle: MockFeeOracleInstance;
  let WETH: TokenInstance;
  const recipientB = accounts[2];
  const recipientA = accounts[3];
  const feeCollector = accounts[4];
  const amount = toWei('5');
  const fee = toWei('0.1');
  const amountWithFee = toBN(amount).add(toBN(fee)).toString();
  const payer = accounts[0];
  const A_NETWORK = 'GRL';
  const A_NETWORK_HEX = padRight(asciiToHex(A_NETWORK), 8);
  const B_NETWORK = 'RPS';
  const B_NETWORK_HEX = padRight(asciiToHex(B_NETWORK), 8);
  const oracle = web3.eth.accounts.create();
  const unlockSigner = accounts[8];

  before(async () => {
    WETH = await Token.new('Wrapped ETH', 'WETH', toWei('1000000'));
    validator = await Validator.deployed();
    feeOracle = await FeeOracle.deployed();
    bridgeA = await Bridge.new(feeCollector, payer, validator.address, feeOracle.address, unlockSigner);
    token = await Token.new('token', 'TKN', toWei('1000000'));
    helper = new Helper(bridgeA, token);
  });

  it('Success: set roles', async () => {
    const tokenManagerRole = await bridgeA.TOKEN_MANAGER();
    const bridgeManagerRole = await bridgeA.BRIDGE_MANAGER();
    await bridgeA.grantRole(tokenManagerRole, payer);
    await bridgeA.grantRole(bridgeManagerRole, payer);
    expect(await bridgeA.hasRole(tokenManagerRole, payer)).eq(true);
    expect(await bridgeA.hasRole(bridgeManagerRole, payer)).eq(true);
  });

  it('Success: activate bridge', async () => {
    await bridgeA.startBridge();
  });

  it('Success: Add WETH to A', async () => {
    await bridgeA.addToken(A_NETWORK_HEX, WETH.address, WETH.address, TokenType.Base);
    const localTokenInfo = await bridgeA.tokenInfos(WETH.address);
    expect(localTokenInfo).deep.include({
      tokenSource: A_NETWORK_HEX,
      tokenSourceAddress: helper.addressToBytes32(WETH.address),
      precision: await WETH.decimals(),
      tokenType: toBN(TokenType.Base)
    });

    expect(await bridgeA.tokenSourceMap(A_NETWORK_HEX, WETH.address)).eq(WETH.address);
  });

  it('Success: Lock', async () => {
    const lockId = '0';
    const balanceBefore = await web3.eth.getBalance(payer);
    const feeCollectorBalanceBefore = await web3.eth.getBalance(feeCollector);
    const lockTx = await bridgeA.lockBase(lockId, WETH.address, recipientB, B_NETWORK_HEX, {value: amountWithFee});
    const gasUsed = lockTx.receipt.gasUsed;

    const balanceAfter = await web3.eth.getBalance(payer);
    expectEvent(lockTx, 'Sent', {
      tokenSource: A_NETWORK_HEX,
      tokenSourceAddress: helper.addressToBytes32(WETH.address),
      recipient: helper.addressToBytes32(recipientB),
      amount,
      lockId,
      destination: B_NETWORK_HEX
    });

    expect(await web3.eth.getBalance(bridgeA.address)).eq(amount);
    const gasAmount = toBN(gasPrice).mul(toBN(gasUsed));

    expect(toBN(balanceBefore).sub(toBN(amountWithFee)).sub(gasAmount).div(toBN(1e16)).toString())
      .eq(toBN(balanceAfter).div(toBN(1e16)).toString()); // div(1e15) to get approximate number
    expect(await web3.eth.getBalance(feeCollector)).eq(toBN(feeCollectorBalanceBefore).add(toBN(fee)).toString());
  });

  it('Success: Unlock', async () => {
    const lockId = '6';
    const source = B_NETWORK;
    const hexSource = padRight(asciiToHex(source), 8);
    const tokenAddress = WETH.address;
    const tokenSourceAddress = WETH.address;
    const amountWithSystemPrecision = toBN(amount).div(toBN(1e9)).toString();

    const signature = helper.getUnlockSignatureByPrivate(oracle.privateKey, lockId, recipientA, amountWithSystemPrecision, source, A_NETWORK, tokenSourceAddress, A_NETWORK);

    const balanceBefore = await web3.eth.getBalance(recipientA);
    const bridgeBalanceBefore = await web3.eth.getBalance(bridgeA.address);
    const unlockTx = await bridgeA.unlock(lockId, recipientA, amountWithSystemPrecision, hexSource, helper.networkToHex(A_NETWORK), tokenSourceAddress, signature);
    const balanceAfter = await web3.eth.getBalance(recipientA);
    const bridgeBalanceAfter = await web3.eth.getBalance(bridgeA.address);

    expectEvent(unlockTx, 'Received', {
      recipient: recipientA,
      token: tokenAddress,
      amount: amount,
      lockId,
      source: B_NETWORK_HEX
    });


    expect(toBN(bridgeBalanceBefore).sub(toBN(amount)).toString()).eq(bridgeBalanceAfter);
    expect(toBN(balanceBefore).add(toBN(amount)).toString()).eq(balanceAfter);
  });

  it ('Fail: lock disabled token', async () => {
    await bridgeA.setTokenStatus(WETH.address, TokenStatus.Disabled);
    await token.approve(bridgeA.address, amountWithFee);
    await expectRevert(
      bridgeA.lockBase('1', WETH.address, recipientB, B_NETWORK_HEX, {value: amountWithFee}),
      'Bridge: disabled token'
    );
    await bridgeA.setTokenStatus(WETH.address, TokenStatus.Enabled);
  })

  it('Success: Remove WETH token', async () => {
    const newAuthority = accounts[9];
    await bridgeA.lockBase('1', WETH.address, recipientB, B_NETWORK_HEX,{value: amountWithFee});
    const balance = await web3.eth.getBalance(bridgeA.address);
    const newAuthorityBalanceBefore = await web3.eth.getBalance(newAuthority);
    await bridgeA.removeToken(A_NETWORK_HEX, WETH.address, newAuthority);
    const tokenInfo = await bridgeA.tokenInfos(WETH.address);
    expect(tokenInfo).deep.include({
      tokenSource: ZERO_BLOCKHAIN_ID,
      tokenSourceAddress: ZERO_BYTES32,
      precision: toBN(0),
      tokenType: toBN(0)
    });

    expect(await bridgeA.tokenSourceMap(A_NETWORK_HEX, WETH.address)).eq(ZERO_ADDRESS);

    expect((await web3.eth.getBalance(bridgeA.address)).toString()).eq('0');
    expect((await web3.eth.getBalance(newAuthority)).toString()).eq(toBN(newAuthorityBalanceBefore).add(toBN(balance)).toString());
  });
});
