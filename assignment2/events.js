const EventEmitter = require('node:events');

const emitter = new EventEmitter();

emitter.on('time', (value) => {
    console.log('Time received:', value)
})

setInterval(() => {
    const now = new Date().toLocaleTimeString();
    emitter.emit('time', now)
}, 5000)

module.exports = emitter;