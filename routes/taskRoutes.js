const express = require('express');

const router = express.Router();
const { index, create, show, update, deleteTask, bulkCreate, bulkUpdate } = require('../controllers/taskController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

router.use(jwtMiddleware);
router.route('/')
    .get(index)
    .post(create);
router.route('/bulk')
    .post(bulkCreate)
    .patch(bulkUpdate);
router.route('/:id')
    .get(show)
    .patch(update)
    .delete(deleteTask);

module.exports = router;