const Token = artifacts.require("Token");
const Pool = artifacts.require("Pool");
const { toWeiBN } = require("./utils.js");

contract('Pool', (accounts) => {
  it('success: flow', async () => {

    const testToken = await Token.deployed();
    const pool = await Pool.deployed();
    
    assert(await pool.baseToken.call(), testToken.address);

    const initialDepositAmount = toWeiBN("100");
    const initialDepositShare = toWeiBN("100");

    // Do the initial deposit
    await testToken.approve(pool.address, initialDepositAmount);
    await pool.deposit(initialDepositAmount);

    assert(await testToken.balanceOf.call(pool.address), initialDepositAmount);
    assert(await pool.balanceOf.call(accounts[0]), initialDepositShare);

    const rewardsAmount = toWeiBN("25");

    // Add some rewards
    await testToken.transfer(pool.address, rewardsAmount);

    const secondDepositAmount = toWeiBN("100");
    const secondDepositShare = toWeiBN("80");

    // Transfer some tokens to the second account
    await testToken.transfer(accounts[1], secondDepositAmount);

    // Do the second deposit
    await testToken.approve(pool.address, secondDepositAmount, {from: accounts[1]});
    await pool.deposit(secondDepositAmount, {from: accounts[1]});

    assert(await testToken.balanceOf.call(pool.address), initialDepositAmount.add(secondDepositAmount));
    assert(await pool.balanceOf.call(accounts[1]), secondDepositShare);
    
    const withdrawShare = toWeiBN("80");
    const withdrawAmount = toWeiBN("120");

    const moreRewardsAmount = toWeiBN("45");

    // Add more rewards
    await testToken.transfer(pool.address, rewardsAmount);

    // Transfer share tokens to another account
    await pool.transfer(accounts[2], withdrawShare);

    // Withdraw from the pool
    await pool.withdraw(withdrawShare, {from: accounts[2]});

    assert(await testToken.balanceOf.call(accounts[2]), withdrawAmount);
    assert(await pool.balanceOf.call(accounts[3]), "0");

    // Full withdraw
    await pool.withdraw(initialDepositShare.sub(withdrawShare), {from: accounts[0]});
    await pool.withdraw(secondDepositShare, {from: accounts[1]});

    assert(await testToken.balanceOf.call(pool.address), "0");
    assert(await pool.totalSupply.call(), "0");
  });
});
