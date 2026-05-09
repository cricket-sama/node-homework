const { StatusCodes } = require('http-status-codes');
const { taskSchema, patchTaskSchema } = require('../validation/taskSchema')
const pool = require('../db/pg-pool');

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

const create = async (req, res) => {
    if (!req.body) req.body = {};
    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.message });
    }
    const is_completed = value.isCompleted;    
    const task  = await pool.query(`INSERT INTO tasks (title, is_completed, user_id) 
      VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
      [value.title, is_completed, global.user_id]);
    res
    .status(StatusCodes.CREATED)
    .json(task.rows[0]);  
};

const index = async (req, res) => {
    const tasks = await pool.query("SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
      [global.user_id]
    )
    if (tasks.rows.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'No task found' });
    }
    return res.json(tasks.rows);
};

const show = async (req, res) => {
    const taskToFind = parseInt(req.params?.id);
    if (!taskToFind) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'The task ID passed is not valid.' });
    }
    const tasks = await pool.query("SELECT id, title, is_completed FROM tasks WHERE user_id = $1 AND id = $2",
        [global.user_id, taskToFind]
    )
    if (tasks.rows.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'No task found' });
    }
    return res.json(tasks.rows[0]);
};

const update = async (req, res) => {
    if (!req.body) req.body = {};
    const {error, value} = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.message });
    }
    const taskToFind = parseInt(req.params?.id);
    if (!taskToFind) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'The task ID passed is not valid.' });
    }
    let keys = Object.keys(value);
    keys = keys.map((key) => key === "isCompleted" ? "is_completed" : key);
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const idParm = `$${keys.length + 1}`;
    const userParm = `$${keys.length + 2}`;
    const updatedTask = await pool.query(`UPDATE tasks SET ${setClauses} 
      WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`, 
      [...Object.values(value), taskToFind, global.user_id]);
    if (!updatedTask.rows.length) {
      return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: 'Task not found' })
    }
    return res.json(updatedTask.rows[0]);
};

const deleteTask = async (req, res) => {
    const taskToFind = parseInt(req.params?.id);
        if (!taskToFind) {
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'The task ID passed is not valid.' })
        }
    const tasks = await pool.query("DELETE FROM tasks WHERE user_id = $1 AND id = $2 RETURNING id, title, is_completed",
        [global.user_id, taskToFind]
    )
    if (!tasks.rows.length) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'No task found' });
    }
    return res.json(tasks.rows[0]);
};

module.exports = { index, create, show, update, deleteTask };
