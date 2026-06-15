const { StatusCodes } = require('http-status-codes');
const { taskSchema, patchTaskSchema, bulkUpdateSchema } = require('../validation/taskSchema');
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
        priority: value.priority,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });
    res
    .status(StatusCodes.CREATED)
    .json(task);  
};

const index = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const whereClause = { userId: req.user.id };

    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: 'insensitive'
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: { 
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true
          }
        }
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const totalTasks = await prisma.task.count({
      where: whereClause
    });

    const pagination = {
      page: page,
      limit: limit,
      total: totalTasks,
      pages: Math.ceil(totalTasks / limit),
      hasNext: page < Math.ceil(totalTasks / limit),
      hasPrev: page > 1,
    };

    if (tasks.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'No task found' });
    };

    return res
      .status(StatusCodes.OK)
      .json({ tasks: tasks, pagination: pagination });
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
            userId: req.user.id,
          },
        },
        select: {
          title: true,
          isCompleted: true,
          id: true,
          User: {
            select: { name: true },
          },
        },
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
        userId: req.user.id,
      },
      select: {
        title: true, 
        isCompleted: true,
        priority: true,
        id:true 
      }
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
            userId: req.user.id,
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

const bulkCreate = async (req, res, next) => {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: 'Invalid request data. Expected an array of tasks.' });
    }

    const validTasks = [];
    for (const task of tasks) {
      const { error, value } = taskSchema.validate(task);
      if (error) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({
            error: 'Validation failed',
            details: error.details,
          });
      }
      validTasks.push({
        title: value.title,
        isCompleted: value.isCompleted,
        priority: value.priority,
        userId: req.user.id,
      });
    }

    try {
      const result = await prisma.task.createMany({
        data: validTasks,
        skipDuplicates: false,
      });

      res
        .status(StatusCodes.CREATED)
        .json({
          message: 'Bulk task creation successful',
          tasksCreated: result.count,
          totalRequested: validTasks.length,
        });
    } catch (err) {
      return next(err);
    }
};

const bulkUpdate = async (req, res, next) => {
  console.log(req.body);
  const { taskIds, isCompleted } = req.body
  if (!req.body) req.body = {};
  const { error, value } = bulkUpdateSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  if (
    !Array.isArray(taskIds) ||
    taskIds.length === 0 ||
    typeof isCompleted !== 'boolean'
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid request data' });
  }

  try {
    const result = await prisma.task.updateMany({
      where: {
        id: {
          in: taskIds
        },
        userId: req.user.id
      },
      data: {
        isCompleted
      }
    });

    return res
      .status(200)
      .json({
        message: 'Tasks updated',
        tasksUpdated: result.count
      });
  } catch (err) {
    return next(err);
  }
};

module.exports = { index, create, show, update, deleteTask, bulkCreate, bulkUpdate };
