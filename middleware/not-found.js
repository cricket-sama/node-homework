const { StatusCodes } = require('http-status-codes');

const notFound = (req, res) => {
    return res
    .status(StatusCodes.NOT_FOUND)
    .send({ message: `You can't do a ${req.method} for ${req.url}` });
};

module.exports = notFound;