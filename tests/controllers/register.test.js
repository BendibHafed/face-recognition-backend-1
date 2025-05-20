const request = require('supertest');
const { app, setupRoutes } = require('../../app');
const knex = require('knex');
const bcrypt = require('bcryptjs');
const { createTables } = require('../../database');

describe('POST /register', () => {
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
    
    // Setup routes with database connection
    setupRoutes(app, pg_db);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await pg_db('users').where('email', 'newuser@test.com').del();
    await pg_db('login').where('email', 'newuser@test.com').del();
  });

  afterAll(async () => {
    await pg_db.destroy();
  });

  it('should return 400 if name is missing', async () => {
    const response = await request(app)
      .post('/register')
      .send({ email: 'newuser@test.com', password: 'testpassword' });
    expect(response.statusCode).toBe(400);
  });

  it('should return 400 if email is missing', async () => {
    const response = await request(app)
      .post('/register')
      .send({ name: 'New User', password: 'testpassword' });
    expect(response.statusCode).toBe(400);
  });

  it('should return 400 if password is missing', async () => {
    const response = await request(app)
      .post('/register')
      .send({ name: 'New User', email: 'newuser@test.com' });
    expect(response.statusCode).toBe(400);
  });

  it('should successfully register a new user', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        name: 'New User',
        email: 'newuser@test.com',
        password: 'testpassword'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('newuser@test.com');
    
    // Verify the user exists in the database
    const user = await pg_db('users').where('email', 'newuser@test.com').first();
    expect(user).toBeDefined();
  });
});