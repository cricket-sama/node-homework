const express = require('express');

const router = express.Router();
const { logon, register, logoff } = require('../controllers/userController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

router.route('/logon').post(logon);
router.route('/register').post(register);
router.use(jwtMiddleware);
router.route('/logoff').post(logoff);


module.exports = router;
