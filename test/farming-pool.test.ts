import { IERC20Instance, FarmingInstance, TokenInstance } from '../types';

const Token = artifacts.require('Token');
const Pool = artifacts.require('Farming');
const {toWei} = web3.utils;
const {time} = require('@openzeppelin/test-helpers');
const {advanceBlockTo} = time;

contract('Farming', function (accounts) {
  const alice = accounts[1];
  const bob = accounts[2];
  const carol = accounts[3];
  let rewardToken: IERC20Instance;
  let pool: FarmingInstance;
  let lp: TokenInstance;
  let lp2: TokenInstance;

  beforeEach(async function () {
    rewardToken = await Token.new('Reward token', 'ABR', toWei('1000000'));
    lp = await Token.new('LPToken', 'LP', '10000000000');

    await lp.transfer(alice, '1000');

    await lp.transfer(bob, '1000');

    await lp.transfer(carol, '1000');

    lp2 = await Token.new('LPToken2', 'LP2', '10000000000');

    await lp2.transfer(alice, '1000');

    await lp2.transfer(bob, '1000');

    await lp2.transfer(carol, '1000');
  });

  it('should set correct state variables', async function () {
    pool = await Pool.new(rewardToken.address, '1000', '0');
    await rewardToken.transfer(pool.address, toWei('1000000'));
    expect(await pool.rewardToken()).to.equal(rewardToken.address);
  });

  it('should allow emergency withdraw', async function () {
    // 100 per block farming rate starting at block 100
    pool = await Pool.new(rewardToken.address, '100', '100');

    await pool.add('100', lp.address, true);

    await lp.approve(pool.address, '1000', {from: bob});

    await pool.deposit(0, '100', {from: bob});

    expect((await lp.balanceOf(bob)).toString()).to.equal('900');

    await pool.emergencyWithdraw(0, {from: bob});

    expect((await lp.balanceOf(bob)).toString()).to.equal('1000');
  });

  it('should give out REWARDs only after farming time', async function () {
    // 100 per block farming rate starting at block 100
    pool = await Pool.new(rewardToken.address, '100', '100');
    await rewardToken.transfer(pool.address, toWei('1000000'));

    await pool.add('100', lp.address, true);

    await lp.approve(pool.address, '1000', {from: bob});
    await pool.deposit(0, '100', {from: bob});
    await advanceBlockTo('89');

    await pool.deposit(0, '0', {from: bob}); // block 90
    expect((await rewardToken.balanceOf(bob)).toString()).to.equal('0');
    await advanceBlockTo('94');

    await pool.deposit(0, '0', {from: bob}); // block 95
    expect((await rewardToken.balanceOf(bob)).toString()).to.equal('0');
    await advanceBlockTo('99');

    await pool.deposit(0, '0', {from: bob}); // block 100
    expect((await rewardToken.balanceOf(bob)).toString()).to.equal('0');
    await advanceBlockTo('100');

    await pool.deposit(0, '0', {from: bob}); // block 101
    expect((await rewardToken.balanceOf(bob)).toString()).to.equal('100');

    await advanceBlockTo('104');
    await pool.deposit(0, '0', {from: bob}); // block 105

    expect((await rewardToken.balanceOf(bob)).toString()).to.equal('500');
  });

  it('should not distribute REWARDs if no one deposit', async function () {
    // 100 per block farming rate starting at block 200
    pool = await Pool.new(rewardToken.address, '100', '200');
    await rewardToken.transfer(pool.address, toWei('1000000'));
    await pool.add('100', lp.address, true);
    await lp.approve(pool.address, '1000', {from: bob});
    await advanceBlockTo('199');
    await advanceBlockTo('204');
    await advanceBlockTo('209');
    await pool.deposit(0, '10', {from: bob}); // block 210
    expect((await rewardToken.balanceOf(bob)).toString()).to.equal('0');
    expect((await lp.balanceOf(bob)).toString()).to.equal('990');
    await advanceBlockTo('219');
    await pool.withdraw(0, '10', {from: bob}); // block 220
    expect((await rewardToken.balanceOf(bob)).toString()).to.equal('1000');
    expect((await lp.balanceOf(bob)).toString()).to.equal('1000');
  });

  it('should distribute REWARDs properly for each staker', async function () {
    // 100 per block farming rate starting at block 300
    pool = await Pool.new(rewardToken.address, '100', '300');
    await rewardToken.transfer(pool.address, toWei('1000000'));
    await pool.add('100', lp.address, true);
    await lp.approve(pool.address, '1000', {
      from: alice
    });
    await lp.approve(pool.address, '1000', {
      from: bob
    });
    await lp.approve(pool.address, '1000', {
      from: carol
    });
    // Alice deposits 10 LPs at block 310
    await advanceBlockTo('309');
    await pool.deposit(0, '10', {from: alice});
    // Bob deposits 20 LPs at block 314
    await advanceBlockTo('313');
    await pool.deposit(0, '20', {from: bob});
    // Carol deposits 30 LPs at block 318
    await advanceBlockTo('317');
    await pool.deposit(0, '30', {from: carol});
    // Alice deposits 10 more LPs at block 320. At this point:
    //   Alice should have: 0.4*1000 + 0.4*1/3*1000 + 0.2*1/6*1000 = 566
    await advanceBlockTo('319');
    await pool.deposit(0, '10', {from: alice});
    expect((await rewardToken.balanceOf(alice)).toString()).to.equal('566');
    expect((await rewardToken.balanceOf(bob)).toString()).to.equal('0');
    expect((await rewardToken.balanceOf(carol)).toString()).to.equal('0');
    // Bob withdraws 5 LPs at block 330. At this point:
    //   Bob should have: 0.4*2/3*1000 + 0.2*2/6*1000 + 2/7*1000 = 619
    await advanceBlockTo('329');
    await pool.withdraw(0, '5', {from: bob});
    expect((await rewardToken.balanceOf(alice)).toString()).to.equal('566');
    expect((await rewardToken.balanceOf(bob)).toString()).to.equal('619');
    expect((await rewardToken.balanceOf(carol)).toString()).to.equal('0');
    // Alice withdraws 20 LPs at block 340.
    // Bob withdraws 15 LPs at block 350.
    // Carol withdraws 30 LPs at block 360.
    await advanceBlockTo('339');
    await pool.withdraw(0, '20', {from: alice});
    await advanceBlockTo('349');
    await pool.withdraw(0, '15', {from: bob});
    await advanceBlockTo('359');
    await pool.withdraw(0, '30', {from: carol});
    // Alice should have: 566 + 2/7*1000 + 2/6.5*1000 = 1159
    expect((await rewardToken.balanceOf(alice)).toString()).to.equal('1159');
    // Bob should have: 619 + 1.5/6.5 * 1000 + 1.5/4.5*1000 = 1183
    expect((await rewardToken.balanceOf(bob)).toString()).to.equal('1183');
    // Carol should have: 0.2*3/6*1000 + 3/7*1000 + 3/6.5*1000 + 3/4.5*1000 + 1000 = 2657
    expect((await rewardToken.balanceOf(carol)).toString()).to.equal('2657');
    // All of them should have 1000 LPs back.
    expect((await lp.balanceOf(alice)).toString()).to.equal('1000');
    expect((await lp.balanceOf(bob)).toString()).to.equal('1000');
    expect((await lp.balanceOf(carol)).toString()).to.equal('1000');
  });

  it('should give proper REWARDs allocation to each pool', async function () {
    // 100 per block farming rate starting at block 400
    pool = await Pool.new(rewardToken.address, '100', '400');
    await rewardToken.transfer(pool.address, toWei('1000000'));
    await lp.approve(pool.address, '1000', {from: alice});
    await lp2.approve(pool.address, '1000', {from: bob});
    // Add first LP to the pool with allocation 1
    await pool.add('10', lp.address, true);
    // Alice deposits 10 LPs at block 410
    await advanceBlockTo('409');
    await pool.deposit(0, '10', {from: alice});
    // Add LP2 to the pool with allocation 2 at block 420
    await advanceBlockTo('419');
    await pool.add('20', lp2.address, true);
    // Alice should have 1000 pending reward
    expect((await pool.pendingReward(0, alice)).toString()).to.equal('1000');
    // Bob deposits 10 LP2s at block 425
    await advanceBlockTo('424');
    await pool.deposit(1, '5', {from: bob});
    // Alice should have 10000 + 0.5*1/3*1000 = 11666 pending reward
    expect((await pool.pendingReward(0, alice)).toString()).to.equal('1166');
    await advanceBlockTo('430');
    // At block 430. Bob should get 0.5*2/3*1000 = 333. Alice should get ~1666 more.
    expect((await pool.pendingReward(0, alice)).toString()).to.equal('1333');
    expect((await pool.pendingReward(1, bob)).toString()).to.equal('333');
  });

  it('should change reward per block', async function () {
    // 100 per block farming rate starting at block 500 with bonus until block 600
    pool = await Pool.new(rewardToken.address, '1000', '500');
    await rewardToken.transfer(pool.address, toWei('1000000'));
    await lp.approve(pool.address, '1000', {from: alice});
    await pool.add('1', lp.address, true);
    // Alice deposits 10 LPs at block 590
    await advanceBlockTo('589');
    await pool.deposit(0, '10', {from: alice});
    // Change rewardPerBlock on 600 block
    await advanceBlockTo('599');
    await pool.setRewardPerBlock('100');
    // At block 605, she should have 1000*10 + 100*5 = 10500 pending.
    await advanceBlockTo('605');
    expect((await pool.pendingReward(0, alice)).toString()).to.equal('10500');
    // At block 606, Alice withdraws all pending rewards and should get 10600.
    await pool.deposit(0, '0', {from: alice});
    expect((await pool.pendingReward(0, alice)).toString()).to.equal('0');
    expect((await rewardToken.balanceOf(alice)).toString()).to.equal('10600');
  });
});
