require('dotenv').config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require('../db/prisma');
const { EventEmitter } = require('events');
const httpMocks = require('node-mocks-http');
const waitForRouteHandlerCompletion = require('./waitForRouteHandlerCompletion');
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require('../controllers/taskController');

let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
  user1 = await prisma.User.create({
    data: { name: 'Bob', email: 'bob@sample.com', hashedPassword: 'nonsense' },
  });
  user2 = await prisma.User.create({
    data: {
      name: 'Alice',
      email: 'alice@sample.com',
      hashedPassword: 'nonsense',
    },
  });
});

afterAll(() => {
  prisma.$disconnect();
});

describe('testing task creation', () => {
  it('14. cant create a task without a user id', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'first task' },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe('TypeError');
    }
  });

  it('15. cant create a task with a bogus user id', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'first task' },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    expect.assertions(1);
    req.user = { id: 0 };
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe('PrismaClientKnownRequestError');
    }
  });

  it('16. if you have a valid user id, create() succeeds', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'first task' },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    req.user = { id: user1.id };
    await waitForRouteHandlerCompletion(create, req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });

  it('17. the object returned from the create() call has the expected title', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'first task' },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    req.user = { id: user1.id };
    await waitForRouteHandlerCompletion(create, req, saveRes);
    saveData = saveRes._getJSONData();
    expect(saveData.title).toBe('first task');
  });

  it('18. the object has the right value for isCompleted', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'first task' },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    req.user = { id: user1.id };
    await waitForRouteHandlerCompletion(create, req, saveRes);
    saveData = saveRes._getJSONData();
    expect(saveData.isCompleted).toBe(false);
  });

  it('19. the object does not have any value for userId', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'first task' },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    req.user = { id: user1.id };
    await waitForRouteHandlerCompletion(create, req, saveRes);
    saveData = saveRes._getJSONData();
    saveTaskId = saveData.id;
    expect(saveData).not.toHaveProperty('userId');
  });
});

describe('test getting created tasks', () => {

  beforeAll(async () => {
    await prisma.Task.deleteMany();
    await prisma.User.deleteMany();
    user1 = await prisma.User.create({
      data: {
        name: 'Bob',
        email: 'bob@sample.com',
        hashedPassword: 'nonsense',
      },
    });
    user2 = await prisma.User.create({
      data: {
        name: 'Alice',
        email: 'alice@sample.com',
        hashedPassword: 'nonsense',
      },
    });
    const task = await prisma.Task.create({
      data: {
        title: 'first task',
        userId: user1.id,
      },
    });
    saveTaskId = task.id;
  });

  it('20. you cant get a list of tasks without a user id', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(index, req, saveRes);
    } catch (e) {
      expect(e.name).toBe('TypeError');
    }
  });

  it('21. If you use user1s id on index() the call returns a 200 status.', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    req.user = { id: user1.id };
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });

  it('22. The returned object has a tasks array of length 1.', async () => {
    saveData = saveRes._getJSONData();
    expect(saveData.tasks.length).toBe(1);
  });

  it('23. the title in the first array object is as expected', async () => {
    saveData = saveRes._getJSONData();
    expect(saveData.tasks[0].title).toBe('first task');
  });

  it('24. the first array object does not contain a userId', async () => {
    saveData = saveRes._getJSONData();
    expect(saveData.tasks[0]).not.toHaveProperty('userId');
  });

  it('25. if you get the list of tasks using the userId from user2, you get a 404', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
    });
    req.user = { id: user2.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  })

  it('26. you can retrieve the created task using show()', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: {
        id: saveTaskId.toString(),
      },
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(show, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });

  it('27. user2 cant retrieve this task entry', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      params: {
        id: saveTaskId.toString(),
      },
    });
    req.user = { id: user2.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(show, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  })
});

describe('test the update and deletion of tasks', () => {

  beforeAll(async () => {
    await prisma.Task.deleteMany();
    await prisma.User.deleteMany();
    user1 = await prisma.User.create({
      data: {
        name: 'Bob',
        email: 'bob@sample.com',
        hashedPassword: 'nonsense',
      },
    });
    user2 = await prisma.User.create({
      data: {
        name: 'Alice',
        email: 'alice@sample.com',
        hashedPassword: 'nonsense',
      },
    });
    const task = await prisma.Task.create({
      data: {
        title: 'first task',
        userId: user1.id,
      },
    });
    saveTaskId = task.id;
  });

  it('28. user1 can set the task corresponding to the saveTaskId to isCompleted: true', async () => {
    const req = httpMocks.createRequest({
      method: 'PATCH',
      params: {
        id: saveTaskId.toString(),
      },
      body: { isCompleted: true },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    req.user = { id: user1.id };
    await waitForRouteHandlerCompletion(update, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });

  it('29. user2 cant do this', async () => {
    const req = httpMocks.createRequest({
      method: 'PATCH',
      params: {
        id: saveTaskId.toString(),
      },
      body: { isCompleted: true },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    req.user = { id: user2.id };
    await waitForRouteHandlerCompletion(update, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  });

  it('30. user2 cant delete this task', async () => {
    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: {
        id: saveTaskId.toString(),
      },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    req.user = { id: user2.id };
    await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  });

  it('31. user1 can delete this task', async () => {
    const req = httpMocks.createRequest({
      method: 'DELETE',
      params: {
        id: saveTaskId.toString(),
      },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    req.user = { id: user1.id };
    await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });

  it('32. retrieving user1s tasks now returns a 404', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  });
});