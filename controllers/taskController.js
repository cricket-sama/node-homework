const { StatusCodes } = require('http-status-codes');
const { taskSchema, patchTaskSchema } = require('../validation/taskSchema')

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

const create = (req, res) => {
    if (!req.body) req.body = {};
    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.message });
    }
    const data = value;
    const newTask = {
      ...data,
      id: taskCounter(),
      userId: global.user_id.email,
    };
    global.tasks.push(newTask);
    const { userId, ...sanitizedTask } = newTask;
    res
    .status(StatusCodes.CREATED)
    .json(sanitizedTask);  
};

const index = (req, res) => {
    const userTasks = global.tasks.filter((task) => task.userId === global.user_id.email);
    if (userTasks.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'No task found' });
    }
    const sanitizedTasks = userTasks.map((task) => {
      const { userId, ...sanitizedTask } = task;
      return sanitizedTask;
    });
    return res.json(sanitizedTasks)
};

const show = () => {};

const update = (req, res) => {
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
    const taskIndex = global.tasks.findIndex(
      (task) => task.id === taskToFind && task.userId === global.user_id.email,
    );
    if (taskIndex === -1) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'That task was not found.' });
    }
    const currentTask = global.tasks[taskIndex];
    Object.assign(currentTask, value);
    const { userId, ...sanitizedTask } = currentTask;
    return res
    .status(StatusCodes.OK)
    .json(sanitizedTask);
};

const deleteTask = (req, res) => {
    const taskToFind = parseInt(req.params?.id);
        if (!taskToFind) {
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'The task ID passed is not valid.' })
        }
    const taskIndex = global.tasks.findIndex((task) => task.id === taskToFind && task.userId === global.user_id.email);
        if (taskIndex === -1) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'That task was not found' });
        }
    const { userId, ...task } = global.tasks[taskIndex];
    global.tasks.splice(taskIndex, 1);
    return res.json(task);
};

module.exports = { index, create, show, update, deleteTask };
