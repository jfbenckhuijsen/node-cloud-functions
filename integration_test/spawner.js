const { spawn } = require('child_process');

module.exports = function doSpawn(script, args, callback) {
  const child = spawn(`${__dirname}/${script}`, args);

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    callback(code);
  });

  return child;
};
