const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log('Platform: ', os.platform());
console.log('CPU: ', os.cpus()[0].model);
console.log('Total Memory: ', os.totalmem());

// Path module
console.log('Joined path: ', path.join(sampleFilesDir, 'sample.txt'));

// fs.promises API
const demoFilePath = path.join(sampleFilesDir, 'demo.txt');

fs.promises.writeFile(demoFilePath, 'Hello from fs.promises!')
  .then(() => fs.promises.readFile(demoFilePath, 'utf-8'))
  .then(contents => console.log('fs.promises read: ', contents))
  .catch(err => console.error(err.message));

// Streams for large files- log first 40 chars of each chunk
const largeFilePath = path.join(sampleFilesDir, 'largefile.txt');

function largeFileText () {
  let str = '';
  for (let i = 0; i < 100; i++) {
    str = str + 'This is a line in a large file...\n'}
    return str;
};

fs.promises.writeFile(largeFilePath, largeFileText())
  .then (() => {
    const stream = fs.createReadStream(largeFilePath, { encoding: 'utf-8', highWaterMark: 1024 });

    stream.on('data', (chunk) => {
      console.log('Read chunk: ', chunk.slice(0, 40));
    });

    stream.on('end', () => {
      console.log('Finished reading large file with streams.');
    });

    stream.on('error', (err) => {
      console.error('Stream error: ', err.message);
    });
  })
  .catch(err => console.log(err));