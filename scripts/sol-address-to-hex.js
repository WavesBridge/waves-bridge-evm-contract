const {question} = require("./_utils");

const bs58 = require('bs58');

(async function () {
  const address = await question("Address");
  console.log('0x' + bs58.decode(address).toString('hex'));
})()
