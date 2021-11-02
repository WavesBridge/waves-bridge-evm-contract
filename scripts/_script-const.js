const network = process.argv[process.argv.findIndex((v) => v === '--network') + 1];

module.exports = {
  BRIDGE_ADDRESS:   network === 'kovan'  ?   '0x4675A2f856efEB37d1e5f8c83d24202127F0B62d' : '',
  FEE_ORACLE_ADDRESS:   network === 'kovan'  ?   '0x4d1BB6e626817cB396120518B4e01801320b954b' : '',
  STAKING_ADDRESS:   network === 'kovan' ? '0x12Ef2D5751A1deDDbfe428384B5843c8Dc4C2da1' : '',
  ABR_ADDRESS:   network === 'kovan' ? '0x24E48a0739e8b9c173f3F955Ac6F8464c61F39C2' : '',

  SERVER_ADDRESS: 'http://localhost:3000',
  TEST_ADDRESS: '0xBe959EED208225aAB424505569d41BF3212142C0',
}
