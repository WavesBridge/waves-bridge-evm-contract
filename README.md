# Allbridge EVM Contracts

## Bridge

## Pool

This is the staking contract for the [Allbridge](https://app.allbridge.io). This contract has the same logic as [SUSHI-xSUSHI pool](https://github.com/sushiswap/sushiswap/blob/master/contracts/SushiBar.sol). Users deposit ABR tokens to the pool and receive xABR in return. Also the pool receives fees collected by the bridge converted to ABR and therefore xABR to ABR exchange rate constantly increases. Another staking incentive for the users is paying smaller bridge fees if sending address has enough xABR balance.

## Wrapped Token