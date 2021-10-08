import BN from 'bn.js';
import { BridgeInstance, TokenInstance } from '../types';
import { Mixed } from 'web3-utils';
const { padRight, asciiToHex } = web3.utils;

export enum TokenType {
  Base,
  Native,
  WrappedV0,
  Wrapped,
}

export class Helper {
  constructor(private bridge: BridgeInstance, private token: TokenInstance) {
  }

  async expectTokenBalance(address: string): Promise<Chai.Assertion> {
      const balance = await this.token.balanceOf(address);
      return expect(balance.toString());
  }

  addressToBytes32(address: string): string {
    return padRight(address.toLowerCase(), 64, '0')
  }

  networkToHex(network: string): string {
    return padRight(asciiToHex(network), 8, '0')
  }

  getUnlockSignatureByPrivate(privateKey: string, transferId: string, recipient: string, amount: BN | string, source: string, tokenSource: string, tokenAddress: string, destination: string) {
    const hash = web3.utils.soliditySha3(
      {t: 'uint256', v: transferId},
      {t: 'address', v: recipient},
      {t: 'uint256', v: amount},
      {t: 'bytes4', v: web3.utils.asciiToHex(source)},
      {t: 'bytes4', v: web3.utils.asciiToHex(tokenSource)},
      {t: 'bytes32', v: tokenAddress},
      {t: 'bytes4', v: web3.utils.asciiToHex(destination)},
      {t: 'string', v: "unlock"},
    );
    if (!hash) {
      throw new Error('Cannot get a hash');
    }
    const sign = web3.eth.accounts.sign(hash, privateKey);
    return sign.signature;
  }
}
