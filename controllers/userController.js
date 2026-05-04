const { StatusCodes } = require('http-status-codes');
const { userSchema } = require('../validation/userSchema');
const crypto = require('crypto');
const util = require('util');
const scrypt = util.promisify(crypto.scrypt);

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
    const { email, password } = req.body;
    const existingUser = global.users.find((u) => {
        return u.email === email;
    });

    if (!existingUser) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .send({ message: 'Authentication Failed' });
    }
    
    const passwordResult = await comparePassword(password, existingUser.hashedPassword);

    if (!passwordResult) {
        return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: 'Authentication Failed' });
    }

    global.user_id = existingUser;
    res.status(StatusCodes.OK).json({
        name: existingUser.name,
        email: existingUser.email
    });
};

const register = async (req, res) => {
    if (!req.body) req.body = {};
    const {error, value} = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.message })
    }
    const hashedPassword = await hashPassword(value.password);    
    const { password, ...safeUser } = value;
    const cleanedUser = {
        ...safeUser,
        hashedPassword
    };
    global.users.push(cleanedUser);
    global.user_id = cleanedUser;
    res.status(StatusCodes.CREATED).json(safeUser);
};

const logoff = (req, res) => {
    global.user_id = null;
    res.sendStatus(StatusCodes.OK);
};

module.exports = { logon, register, logoff };
