// Write your tests here
const db = require('../data/dbConfig')
const server = require('./server');
const request = require('supertest');

const authMod = require('./auth/auth-model')

const userCred = {username: "Captain Marvel", password: "foobar"}
const invalidUser = {message: "username and password required"}
const notUnique = {message: "username taken"}

const regURL = '/api/auth/register'
const loginURL = '/api/auth/login'

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
      await request(server).post(regURL).send(userCred);
      let result = await authMod.findBy();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('username');
    })
    test('on success receives 201', async () => {
      let result = await request(server).post(regURL).send(userCred);
      expect(result.statusCode).toBe(201);
    })
    test('responds with created user', async () => {
      let result = await request(server).post(regURL).send(userCred);
      expect(result.body).toMatchObject({username: "Captain Marvel", id: 1})
    })
    test('does not save password in plain text', async () => {
      let result = await request(server).post(regURL).send(userCred);
      expect(result.body.password).not.toBe(userCred.password)
    })
    test('fails if missing username or password', async () => {
      let result = await request(server).post(regURL).send({username: 'Loki'});
      expect(result.statusCode).toBe(404);
      expect(result.body).toEqual(invalidUser);
      result = await request(server).post(regURL).send({password: '1234'});
      expect(result.statusCode).toBe(404);
      expect(result.body).toEqual(invalidUser);
    })
    test('must have unique username', async () => {
      await request(server).post(regURL).send(userCred);
      let result = await request(server).post(regURL).send(userCred);
      expect(result.statusCode).toBe(404);
      expect(result.body).toEqual(notUnique);
    })
  })// endpoint /api/auth/register

  describe('[POST] /api/auth/login', () => {
    beforeEach(async () => {
      await request(server).post(regURL).send(userCred);
    })
    test('successfully logs in', async () => {
      let result = await request(server).post(loginURL).send(userCred)
      expect(result.body).toMatchObject({message: `welcome, Captain Marvel`})
    })
    test('receives token on login', async () => {
      let result = await request(server).post(loginURL).send(userCred)
      expect(result.body).toHaveProperty('token')
    })
    test('receives status code 200', async () => {
      let result = await request(server).post(loginURL).send(userCred)
      expect(result.statusCode).toBe(200);
    })
    test('requires both username and password', async () => {
      let result = await request(server).post(loginURL).send({username: 'L'});
      expect(result.statusCode).toBe(404);
      expect(result.body).toEqual(invalidUser);
      result = await request(server).post(loginURL).send({password: ''});
      expect(result.statusCode).toBe(404);
      expect(result.body).toEqual(invalidUser);
    })
    test('invalid if username does not exist', async () => {
      let result = await request(server).post(loginURL).send({username: 'squidgamer', password: '12334'});
      expect(result.statusCode).toBe(404);
      expect(result.body).toEqual({message: 'invalid credentials'})
    })
  })// endpoint /api/auth/login
})