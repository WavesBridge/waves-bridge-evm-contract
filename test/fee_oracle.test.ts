import { FeeOracleInstance, IERC20Instance, PoolInstance, TokenInstance } from '../types';

const Token = artifacts.require('Token');
const Pool = artifacts.require('Pool');
const FeeOracle = artifacts.require('FeeOracle');
const { toWei } = web3.utils;

contract("Pool", function (accounts) {
  const alice = accounts[1]
  let rewardToken: IERC20Instance;
  let pool: PoolInstance;
  let feeOracle: FeeOracleInstance;
  let lp: TokenInstance;
  let lp2: TokenInstance;

  beforeEach(async function () {
    rewardToken = await Token.new('Reward token', 'ABR', toWei('1000000'))
    lp = await Token.new("LPToken", "LP", toWei("100000000"))
    lp2 = await Token.new("LPToken2", "LP2",  toWei("100000000"))
    pool = await Pool.new(rewardToken.address, "1000", "10000")
    await pool.add("100", lp.address, true);
    await pool.add("100", lp2.address, true);
    feeOracle = await FeeOracle.new(pool.address, '30');
    await feeOracle.setMultiplier(0, "2000000");
    await feeOracle.setMultiplier(1, "200000");
    await lp.transfer(alice, toWei("25000000"));
    await lp.transfer(pool.address, toWei("5000000"));
    await lp2.transfer(alice, toWei("25000000"));
    await lp2.transfer(pool.address, toWei("5000000"));
  })

  it("test fee", async function () {
    await lp.approve(pool.address, toWei("25000000"), {from: alice})
    await lp2.approve(pool.address, toWei("25000000"), {from: alice})

    let result = await feeOracle.fee(lp.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.0029").toString());
    expect(+result.toString()).lt(+toWei("0.0031").toString());

    await pool.deposit(0, toWei("100"), {from: alice});
    await pool.deposit(1, toWei("500"), {from: alice}); // Multiplier for pool 1 is 10 times less than for pool 0
    result = await feeOracle.fee(lp.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.00265").toString());
    expect(+result.toString()).lt(+toWei("0.0027").toString());
    await pool.withdraw(0, toWei("100"), {from: alice});

    await pool.deposit(0, toWei("500"), {from: alice});
    result = await feeOracle.fee(lp.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.0017").toString());
    expect(+result.toString()).lt(+toWei("0.0019").toString());
    await pool.withdraw(0, toWei("500"), {from: alice});

    await pool.deposit(0, toWei("1000"), {from: alice});
    result = await feeOracle.fee(lp.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.0013").toString());
    expect(+result.toString()).lt(+toWei("0.0015").toString());
    await pool.withdraw(0, toWei("1000"), {from: alice});

    await pool.deposit(0, toWei("5000"), {from: alice});
    result = await feeOracle.fee(lp.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.0004").toString());
    expect(+result.toString()).lt(+toWei("0.00045").toString());
    await pool.withdraw(0, toWei("5000"), {from: alice});

    await pool.deposit(0, toWei("25000"), {from: alice});
    result = await feeOracle.fee(lp.address, alice, toWei("1"), "0x0");
    expect(+result.toString()).gt(+toWei("0.00009").toString());
    expect(+result.toString()).lt(+toWei("0.0001").toString());
    await pool.withdraw(0, toWei("25000"), {from: alice});
  })
})
