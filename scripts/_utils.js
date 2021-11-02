const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const DEFAULT_MESSAGE = "Press any key to continue..."

module.exports.pressAnyKey = function () {

  console.log(DEFAULT_MESSAGE);

  return new Promise((resolve, reject) => {
    const handler = buffer => {
      process.stdin.removeListener("data", handler);
      process.stdin.setRawMode(false);
      process.stdin.pause();

      const bytes = Array.from(buffer);

      if (bytes.length && bytes[0] === 3) {
        process.exit(1);
      }
      process.nextTick(resolve);
    };

    process.stdin.resume();
    process.stdin.setRawMode(true);
    process.stdin.once("data", handler);
  });
};

module.exports.question = function (message, defaultValue) {
  return new Promise((resolve) => {
    if (defaultValue) {
      message += ` (${defaultValue})`;
    }
    rl.question(message + '\n', (result) => {
      resolve(result || defaultValue);
    });
  })
}
