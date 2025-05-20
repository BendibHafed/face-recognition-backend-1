const request = require('supertest');
const { app, setupRoutes } = require('../../app');
const knex = require('knex');
const bcrypt = require('bcryptjs');
const { createTables } = require('../../database');

describe('POST /signin', () => {
  let pg_db;

  beforeAll(async () => {
    // Setup test database connection
    pg_db = knex({
      client: 'pg',
      connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      }
    });

    // Create tables if they don't exist
    await createTables(pg_db);

    // Create a test user
    const hash = bcrypt.hashSync('testpassword', 8);
    await pg_db('login').insert({ email: 'test@test.com', hash });
    await pg_db('users').insert({
      name: 'Test User',
      email: 'test@test.com',
      entries: 0,
      joined: new Date()
    });

    // Setup routes with database connection
    setupRoutes(app, pg_db);
  });

  afterAll(async () => {
    // Clean up test data
    await pg_db('users').where('email', 'test@test.com').del();
    await pg_db('login').where('email', 'test@test.com').del();
    await pg_db.destroy();
  });

  it('should return 400 if email is missing', async () => {
    const response = await request(app)
      .post('/signin')
      .send({ password: 'testpassword' });
    expect(response.statusCode).toBe(400);
  });

  it('should return 400 if password is missing', async () => {
    const response = await request(app)
      .post('/signin')
      .send({ email: 'test@test.com' });
    expect(response.statusCode).toBe(400);
  });

  it('should return 200 and user data for valid credentials', async () => {
    const response = await request(app)
      .post('/signin')
      .send({ email: 'test@test.com', password: 'testpassword' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('email', 'test@test.com');
  });
});