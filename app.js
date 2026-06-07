const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const rateLimiter = require('express-rate-limit');
const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const analyticsRouter = require('./routes/analyticsRoutes');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const prisma = require('./db/prisma');

app.set('trust proxy', 1);

const logger = (req, res, next) => {
    console.log(req.method, req.path, req.query)
    next()
}

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
);
app.use(helmet());
app.use(logger);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(xss());

app.get('/', (req, res) => {
  res.send({ message: 'Hello, World!' });
});

app.post('/testpost', (req, res) => {
    res.send({ message: 'I like Dr. Pepper!' });
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res
      .status(500)
      .json({ status: 'error', db: 'not connected', error: err.message });
  }
});

app.use('/api/users', userRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/analytics', analyticsRouter);

app.use(notFound);

app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}...`),
);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Shutting down gracefully...');
  try {
    await new Promise((resolve) => server.close(resolve));
    console.log('HTTP server closed.');
    // If you have DB connections, close them here
    await prisma.$disconnect();
    console.log('Prisma disconnected');
  } catch (err) {
    console.error('Error during shutdown:', err);
    code = 1;
  } finally {
    console.log('Exiting process...');
    process.exit(code);
  }
}

process.on('SIGINT', () => shutdown(0)); // ctrl+c
process.on('SIGTERM', () => shutdown(0)); // e.g. `docker stop`
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown(1);
});

module.exports = { app, server };
