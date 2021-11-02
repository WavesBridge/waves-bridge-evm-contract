import { IERC20Instance, StakingInstance } from '../types';
import { expectRevert } from '@openzeppelin/test-helpers';
const { toWei } = web3.utils;

const Token = artifacts.require('Token');
const Staking = artifacts.require('Staking');

contract("Staking", function (accounts) {
  let ABR: IERC20Instance;
  let staking: StakingInstance;
  let alice = accounts[1];
  let bob = accounts[2];
  let carol = accounts[3];

  beforeEach(async function () {
    ABR = await Token.new('Reward token', 'ABR', toWei('300'));
    staking =  await Staking.new(ABR.address);
    await ABR.transfer(alice, "100");
    await ABR.transfer(bob, "100");
    await ABR.transfer(carol, "100");
  })

  it("should not allow deposit if not enough approve", async function () {
    await expectRevert(staking.deposit("100", {from: alice}), "ERC20: transfer amount exceeds allowance");
    await ABR.approve(staking.address, "50", {from: alice})
    await expectRevert(staking.deposit("100", {from: alice}), "ERC20: transfer amount exceeds allowance")
    await ABR.approve(staking.address, "100", {from: alice})
    await staking.deposit("100", {from: alice})
    expect((await staking.balanceOf(alice)).toString()).to.equal("100")
  })

  it("should not allow withraw more than what you have", async function () {
    await ABR.approve(staking.address, "100", {from: alice})
    await staking.deposit("100", {from: alice})
    await expectRevert(staking.withdraw("200", {from: alice}), "ERC20: burn amount exceeds balance")
  })

  it("should work with more than one participant", async function () {
    await ABR.approve(staking.address, "100", {from: alice})
    await ABR.approve(staking.address, "100", { from: bob })
    // Alice deposits and gets 20 shares. Bob deposits and gets 10 shares.
    await staking.deposit("20", {from: alice})
    await staking.deposit("10", { from: bob })
    expect((await staking.balanceOf(alice)).toString()).to.equal("20")
    expect((await staking.balanceOf(bob)).toString()).to.equal("10")
    expect((await ABR.balanceOf(staking.address)).toString()).to.equal("30")
    // Staking get 20 more ABRs from an external source.
    await ABR.transfer(staking.address, "20", { from: carol })
    // Alice deposits 10 more ABRs. She should receive 10*30/50 = 6 shares.
    await staking.deposit("10", {from: alice})
    expect((await staking.balanceOf(alice)).toString()).to.equal("26")
    expect((await staking.balanceOf(bob)).toString()).to.equal("10")
    // Bob withdraws 5 shares. He should receive 5*60/36 = 8 shares
    await staking.withdraw("5", { from: bob })
    expect((await staking.balanceOf(alice)).toString()).to.equal("26")
    expect((await staking.balanceOf(bob)).toString()).to.equal("5")
    expect((await ABR.balanceOf(staking.address)).toString()).to.equal("52")
    expect((await ABR.balanceOf(alice)).toString()).to.equal("70")
    expect((await ABR.balanceOf(bob)).toString()).to.equal("98")
  })
})
