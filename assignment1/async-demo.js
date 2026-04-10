const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'sample-files', 'sample.txt');

// Write a sample file for demonstration
fs.writeFile(filePath, 'Hello, async world!', (err) => {
  if (err) throw err;
});

// 1. Callback style
fs.readFile(filePath, 'utf-8', (err, fileContents) => {
  if (err) {
    console.log('file open failed: ', err.message);
  } else {
    console.log('Callback read: ', fileContents);
  }
});

// Callback hell example (test and leave it in comments):
// fs.readFile(filePath, 'utf-8', (err, fileContents) => {
//   if (err) {
//     console.log('file open failed: ', err.message);
//   } else {
//     fs.readFile(filePath, 'utf-8', (err, fileContents) => {
//       if (err) {
//         console.log('file open failed: ', err.message);
//       } else {
//         fs.readFile(filePath, 'utf-8', (err, fileContents) => {
//           if (err) {
//             console.log('file open failed: ', err.message);
//           } else {
//           console.log(fileContents);
//           }
//         });
//       }
//     });
//   }
// });

// 2. Promise style
fs.promises.readFile(filePath, 'utf-8')
    .then(contents => console.log('Promise read: ', contents))
    .catch(err => console.error(err.message));

// 3. Async/Await style
const asyncAwaitFunc = async () => {
  try {
    const contents = await fs.promises.readFile(filePath, 'utf-8');
    console.log('Async/Await read: ', contents);
  } catch (err) {
    console.error(err.message);
  }
};
asyncAwaitFunc();