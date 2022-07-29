// Write your tests here
const db = require('../data/dbConfig')
const server = require('./server');
const request = require('supertest');

const authMod = require('./auth/auth-model')

const newUser = {username: "Captain Marvel", password: "foobar"}
const invalidUser = {message: "username and password required"}
const notUnique = {message: "username taken"}
const regURL = '/api/auth/register'

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
})

beforeEach(async() => {
  await db('users').truncate();
})

afterAll(async() => {
  await db.destroy('users');
})

describe('Authenication Endpoints', () => {
  describe('[POST] /api/auth/register', () => {

    test('successfully adds new account', async () => {
      await request(server).post(regURL).send(newUser);
      let result = await authMod.findBy();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('username');
    })
    test('on success receives 201', async () => {
      let result = await request(server).post(regURL).send(newUser);
      expect(result.statusCode).toBe(201);
    })
    test('responds with created user', async () => {
      let result = await request(server).post(regURL).send(newUser);
      expect(result.body).toEqual({...newUser, id: 1})
    })
    test('[ERROR] fails if missing username or password', async () => {
      let result = await request(server).post(regURL).send({username: 'Loki'});
      expect(result.statusCode).toBe(404);
      expect(result.body).toEqual(invalidUser);
      result = await request(server).post(regURL).send({password: '1234'});
      expect(result.statusCode).toBe(404);
      expect(result.body).toEqual(invalidUser);
    })
    test('[ERROR] must have unique username', async () => {
      await request(server).post(regURL).send(newUser);
      let result = await request(server).post(regURL).send(newUser);
      expect(result.statusCode).toBe(404);
      expect(result.body).toEqual(notUnique);
    })
  })
})