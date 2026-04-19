const { StatusCodes } = require('http-status-codes');

const logon = (req, res) => {
    const { email, password } = req.body;
    const existingUser = global.users.find((u) => {
        return u.email === email;
    });

    if (!existingUser || password !== existingUser.password) {
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

const register = (req, res) => {
  const newUser = { ...req.body };
  global.users.push(newUser);
  global.user_id = newUser;
  delete req.body.password;
  res.status(StatusCodes.CREATED).json(req.body);
};

const logoff = (req, res) => {
    global.user_id = null;
    res.sendStatus(StatusCodes.OK);
};

module.exports = { logon, register, logoff };
