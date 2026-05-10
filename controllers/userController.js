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
    
    let user = null;
    try {
    user = await prisma.user.create({
        data: { name: value.name,
                email: value.email,
                hashedPassword: value.hashedPassword
            },
        select: { name: true, email: true, id: true}
    });
    } catch (err) {
        if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
        res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Email already registered' });
        } else {
        return next(err);
        }
    }
    if (!user) return next(new Error('User creation failed'));
    global.user_id = user.id;
    const cleanUser = {
        name: user.name,
        email: user.email
    };
    res.status(StatusCodes.CREATED).json(cleanUser);
};

const logoff = async (req, res) => {
    global.user_id = null;
    res.sendStatus(StatusCodes.OK);
};

module.exports = { logon, register, logoff };
