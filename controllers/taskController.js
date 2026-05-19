const { StatusCodes } = require('http-status-codes');
const { taskSchema, patchTaskSchema } = require('../validation/taskSchema');
const prisma = require('../db/prisma');

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
    const isCompleted = value.isCompleted;    
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: isCompleted,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });
    res
    .status(StatusCodes.CREATED)
    .json(task);  
};

const index = async (req, res) => {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });
    if (tasks.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'No task found' });
    }
    return res.json(tasks);
};

const show = async (req, res, next) => {
    const taskToFind = parseInt(req.params?.id);
    if (Number.isNaN(taskToFind)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'The task ID passed is not valid.' });
    }
    try {
      const task = await prisma.task.findUnique({
        where: {
          id_userId: {
            id: taskToFind,
            userId: global.user_id,
          },
        },
        select: { title: true, isCompleted: true, id: true },
      });
      if (!task) {
        return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Task not found.' })
      }
      return res.json(task);
    } catch (err) {
        return next(err);
    }
};

const update = async (req, res, next) => {
    if (!req.body) req.body = {};
    const {error, value} = patchTaskSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.message });
    }
    const taskToFind = parseInt(req.params?.id);
    if (Number.isNaN(taskToFind)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'The task ID passed is not valid.' });
    }
    try {
      const task = await prisma.task.update({
        data: value,
        where: {
          id: taskToFind,
          userId: global.user_id,
        },
        select: { title: true, isCompleted: true, id:true }
      });
      return res.json(task);
    } catch (err) {
      if (err.code === 'P2025') {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: 'The task was not found.' });
      } else {
        return next(err);
      }
    }
};

const deleteTask = async (req, res, next) => {
    const taskToFind = parseInt(req.params?.id);
        if (Number.isNaN(taskToFind)) {
        return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'The task ID passed is not valid.' })
        }
    try {
      const task = await prisma.task.delete({
        where: {
          id_userId: {
            id: taskToFind,
            userId: global.user_id,
          },
        },
      });
      return res.json(task);
    } catch (err) {
      if (err.code === 'P2025') {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: 'The task was not found.' });
      } else {
        return next(err);
      }
    }
};

module.exports = { index, create, show, update, deleteTask };
