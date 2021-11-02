import { FeeOracleInstance, IERC20Instance, PoolInstance, StakingInstance, TokenInstance } from '../types';

const Token = artifacts.require('Token');
const Staking = artifacts.require('Staking');
const FeeOracle = artifacts.require('FeeOracle');
const { toWei } = web3.utils;

contract("Pool", function (accounts) {
  const alice = accounts[1]
  const bob = accounts[2]
  let ABR: IERC20Instance;
  let pool: StakingInstance;
  let feeOracle: FeeOracleInstance;

  beforeEach(async function () {
    ABR = await Token.new('Reward token', 'ABR', toWei('2500000000'))
    pool = await Staking.new(ABR.address)

    feeOracle = await FeeOracle.new(pool.address, '30');
    await feeOracle.setFeeMultiplier("2000000");
    await ABR.transfer(bob, toWei("5000000"));
    await ABR.approve(pool.address, toWei("5000000"), {from: bob})
    await pool.deposit(toWei("5000000"), {from: bob})
  })

  it("test fee", async function () {
    let result = await feeOracle.fee(ABR.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.0029").toString());
    expect(+result.toString()).lt(+toWei("0.0031").toString());

    await pool.transfer(alice, toWei("100"), {from: bob});
    result = await feeOracle.fee(ABR.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.00265").toString());
    expect(+result.toString()).lt(+toWei("0.0027").toString());
    await pool.transfer(bob, toWei("100"), {from: alice});

    await pool.transfer(alice, toWei("500"), {from: bob});
    result = await feeOracle.fee(ABR.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.0017").toString());
    expect(+result.toString()).lt(+toWei("0.0019").toString());
    await pool.transfer(bob, toWei("500"), {from: alice});

    await pool.transfer(alice, toWei("1000"), {from: bob});
    result = await feeOracle.fee(ABR.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.0013").toString());
    expect(+result.toString()).lt(+toWei("0.0015").toString());
    await pool.transfer(bob, toWei("1000"), {from: alice});

    await pool.transfer(alice, toWei("5000"), {from: bob});
    result = await feeOracle.fee(ABR.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.0004").toString());
    expect(+result.toString()).lt(+toWei("0.00045").toString());
    await pool.transfer(bob, toWei("5000"), {from: alice});

    await pool.transfer(alice, toWei("25000"), {from: bob});
    result = await feeOracle.fee(ABR.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.00009").toString());
    expect(+result.toString()).lt(+toWei("0.0001").toString());
    await pool.transfer(bob, toWei("25000"), {from: alice});
  })

  it("test small change", async function () {
    await pool.transfer(alice, toWei("100"), {from: bob});
    const fee100 = await feeOracle.fee(ABR.address, alice, toWei("1"), "0x0");
    await pool.transfer(alice, toWei("0.001"), {from: bob});
    const fee101 = await feeOracle.fee(ABR.address, alice, toWei("1"), "0x0");
    expect(fee100.toString()).not.eq(fee101.toString());
    await pool.transfer(bob, toWei("100.001"), {from: alice});
  })
})
