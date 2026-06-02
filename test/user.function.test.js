require('dotenv').config();
const request = require('supertest');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require('../db/prisma');
let agent;
let saveRes;
const { app, server } = require('../app');
const expectCookies = require('supertest/lib/cookies');

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});

describe('register a user ', () => {
  let saveRes = null;
  it('46. it creates the user entry', async () => {
    const newUser = {
      name: 'John Deere',
      email: 'jdeere@example.com',
      password: 'Pa$$word20',
    };
    saveRes = await agent.post('/api/users/register').send(newUser);
    expect(saveRes.status).toBe(201);
  });

  it('47. registration returns an object with the expected name', async () => {
    expect(saveRes.body.user.name).toBe('John Deere');
  });

  it('48. the returned object includes a csrfToken', async () => {
    expect(saveRes.body).toHaveProperty('csrfToken');
  });

  it('49. You can logon as the newly registered user', async () => {
    saveRes = await agent
        .post('/api/users/logon')
        .send({
            email: saveRes.body.user.email,
            password: 'Pa$$word20'
        });
    expect(saveRes.statusCode).toBe(200);
    csrfToken = saveRes.body.csrfToken;
  });

  it('50. verify that you are logged in: /api/tasks should not return a 401', async () => {
    saveRes = await agent.get('/api/tasks');
    expect(saveRes.statusCode).not.toBe(401);
  });

  it('51. verify that you can log out', async () => {
    saveRes = await agent.post('/api/users/logoff').set('X-CSRF-TOKEN', csrfToken);
    expect(saveRes.statusCode).toBe(200);
  });

  it('52. make sure that you are really logged out: /api/tasks should now return a 401', async () => {
    saveRes = await agent.get('/api/tasks');
    expect(saveRes.statusCode).toBe(401);
  });
});