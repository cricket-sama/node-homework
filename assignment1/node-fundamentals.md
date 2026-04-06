# Node.js Fundamentals

## What is Node.js?
Node.js is a runtime environment that executes code outside the browser

## How does Node.js differ from running JavaScript in the browser?
Node.js can access the file system, as well as open a web server socket. You can also execute code in the terminal

## What is the V8 engine, and how does Node use it?
The V8 engine executes code within Chrome. With Node, the V8 engine is used to execute JavaScript outside the browser

## What are some key use cases for Node.js?
- Streaming, because it has stream modules built in and data can be processed in chunks
- Real-time applications because it can process I/O requests without blocking the event loop

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
```js
// CJS is synchronous and uses require() and module exports
const math = require('./math.js'); // importing a module
module.exports = { add, multiply } // exporting functions
```

**ES Modules (supported in modern Node.js):**
```js
// ES Modules are the more modern standard, using import and export
import { add, multiply } from './math.js'; //importing a module
export { add, multiply } // exporting functions
``` 