const network = process.argv[process.argv.findIndex((v) => v === '--network') + 1];

module.exports = {
  BRIDGE_ADDRESS:   network === 'holesky'  ?   '0x19df3e9d0599CD25147ab6E9e15B6C5db8699C49' : '',

  SERVER_ADDRESS: 'http://localhost:3000',
  TEST_ADDRESS: '0xBe959EED208225aAB424505569d41BF3212142C0',
}
