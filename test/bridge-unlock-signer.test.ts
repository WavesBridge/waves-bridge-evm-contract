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

    const tokenManagerRole = await bridgeA.TOKEN_MANAGER();
    const bridgeManagerRole = await bridgeA.BRIDGE_MANAGER();
    await bridgeA.grantRole(tokenManagerRole, payer);
    await bridgeB.grantRole(tokenManagerRole, payer);
    await bridgeA.grantRole(bridgeManagerRole, payer);
    await bridgeB.grantRole(bridgeManagerRole, payer);

    await bridgeA.startBridge();
    await bridgeB.startBridge();

    await bridgeA.addToken(A_NETWORK_HEX, token.address, token.address, TokenType.Native);
    await bridgeA.addToken(A_NETWORK_HEX, wrappedTokenSourceAddress, wrappedTokenA.address, TokenType.Wrapped);
    await bridgeB.addToken(A_NETWORK_HEX, token.address, wrappedTokenB.address, TokenType.Wrapped);

    let lockId = toBN(0);
    await token.approve(bridgeA.address, amountWithFee);
    await bridgeA.lock(lockId, token.address, recipientB, B_NETWORK_HEX, amountWithFee);
  });

  it('Success: Unlock native', async () => {
    const lockId = '4';
    const hexSource = padRight(asciiToHex(A_NETWORK), 8);
    const sourceAddress = token.address;

    const amountWithSystemPrecision = toBN(amount).div(toBN(1e9)).toString();
    const signature = '0x0';

    const wrapTx = await bridgeB.unlock(lockId, recipientB, amountWithSystemPrecision, hexSource, hexSource, sourceAddress, signature, {from: unlockSigner});

    expectEvent(wrapTx, 'Received', {
      recipient: recipientB,
      token: wrappedTokenB.address,
      amount: amountSubFee,
      lockId,
      source: hexSource
    });

    const recipientBalance = await wrappedTokenB.balanceOf(recipientB);
    const feeCollectorBalance = await wrappedTokenB.balanceOf(feeCollector);
    expect(recipientBalance.toString()).eq(amountSubFee);
    expect(feeCollectorBalance.toString()).eq(fee);
  });

  it('Success: Unlock wrapped', async () => {
    const lockId = '6';
    const hexSource = padRight(asciiToHex(B_NETWORK), 8);
    const tokenAddress = token.address;
    const amountWithSystemPrecision = toBN(amount).div(toBN(1e9)).toString();

    const signature = '0x0';

    const unlockTx = await bridgeA.unlock(lockId, recipientA, amountWithSystemPrecision, hexSource, helper.networkToHex(A_NETWORK), tokenAddress, signature, {from: unlockSigner});

    expectEvent(unlockTx, 'Received', {
      recipient: recipientA,
      token: tokenAddress,
      amount: amountSubFee,
      lockId,
      source: B_NETWORK_HEX
    });

    (await helper.expectTokenBalance(bridgeA.address)).eq('0');
    (await helper.expectTokenBalance(recipientA)).eq(amountSubFee);
    (await helper.expectTokenBalance(feeCollector)).eq(toBN(fee).mul(toBN(2)).toString());
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
  const amountSubFee = toBN(amount).sub(toBN(fee)).toString();
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

    const tokenManagerRole = await bridgeA.TOKEN_MANAGER();
    const bridgeManagerRole = await bridgeA.BRIDGE_MANAGER();
    await bridgeA.grantRole(tokenManagerRole, payer);
    await bridgeA.grantRole(bridgeManagerRole, payer);

    await bridgeA.startBridge();
    await bridgeA.addToken(A_NETWORK_HEX, WETH.address, WETH.address, TokenType.Base);

    await bridgeA.lockBase('0', WETH.address, recipientB, B_NETWORK_HEX, {value: amountWithFee});
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
    const feeCollectorBalanceBefore = await web3.eth.getBalance(feeCollector);
    const bridgeBalanceBefore = await web3.eth.getBalance(bridgeA.address);
    const unlockTx = await bridgeA.unlock(lockId, recipientA, amountWithSystemPrecision, hexSource, helper.networkToHex(A_NETWORK), tokenSourceAddress, signature, {from: unlockSigner});
    const balanceAfter = await web3.eth.getBalance(recipientA);
    const bridgeBalanceAfter = await web3.eth.getBalance(bridgeA.address);

    expectEvent(unlockTx, 'Received', {
      recipient: recipientA,
      token: tokenAddress,
      amount: amountSubFee,
      lockId,
      source: B_NETWORK_HEX
    });


    expect(toBN(bridgeBalanceBefore).sub(toBN(amount)).toString()).eq(bridgeBalanceAfter);
    expect(toBN(balanceBefore).add(toBN(amountSubFee)).toString()).eq(balanceAfter);
    expect(await web3.eth.getBalance(feeCollector)).eq(toBN(feeCollectorBalanceBefore).add(toBN(fee)).toString());
  });
});
