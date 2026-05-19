const { StatusCodes } = require('http-status-codes');
const { userSchema } = require('../validation/userSchema');
const crypto = require('crypto');
const util = require('util');
const scrypt = util.promisify(crypto.scrypt);
const prisma = require('../db/prisma');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const logon = async (req, res) => {
    let { email, password } = req.body;
    if (!email) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'Authentication Failed' });
    }

    email = email.toLowerCase()
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'Authentication Failed' });
    }
    
    const passwordResult = await comparePassword(
        password, 
        user.hashedPassword
    );

    if (!passwordResult) {
        return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'Authentication Failed' });
    }

    global.user_id = user.id;
    res.status(StatusCodes.OK).json({
        name: user.name,
        email: user.email
    });
};

const register = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
            message: 'Validation failed',
            details: error.details,
        });
    }
    value.hashedPassword = await hashPassword(value.password);
    delete value.password;
    
    try {
      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: value.email,
            name: value.name,
            hashedPassword: value.hashedPassword
            },
          select: {
            id: true,
            email: true,
            name: true
            },
        });

        const welcomeTaskData = [
          {
            title: 'Complete your profile',
            userId: newUser.id,
            priority: 'medium',
          },
          {
            title: 'Add your first task',
            userId: newUser.id,
            priority: 'high',
          },
          { title: 'Explore the app', userId: newUser.id, priority: 'low' },
        ];
        await tx.task.createMany({ data: welcomeTaskData });

        const welcomeTasks = await tx.task.findMany({
          where: {
            userId: newUser.id,
            title: { in: welcomeTaskData.map((t) => t.title) },
          },
          select: {
            id: true,
            title: true,
            isCompleted: true,
            userId: true,
            priority: true,
          },
        });

        return { user: newUser, welcomeTasks };
      });

      global.user_id = result.user.id;

      res.status(201);
      res.json({
        user: result.user,
        welcomeTasks: result.welcomeTasks,
        transactionStatus: 'success',
      });
      return;
    } catch (err) {
      if (err.code === 'P2002') {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: 'Email already registered' });
      } else {
        return next(err);
      }
    }
};

const logoff = async (req, res) => {
    global.user_id = null;
    res.sendStatus(StatusCodes.OK);
};

module.exports = { logon, register, logoff };
