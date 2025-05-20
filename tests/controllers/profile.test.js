const request = require('supertest');
const { app, setupRoutes } = require('../../app');
const knex = require('knex');
const bcrypt = require('bcryptjs');
const { createTables } = require('../../database');

describe('GET /profile/:id', () => {
  let pg_db;
  let testUserId;

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
    await pg_db('login').insert({ email: 'profile@test.com', hash });
    const [user] = await pg_db('users')
      .returning('id')
      .insert({
        name: 'Profile Test User',
        email: 'profile@test.com',
        entries: 5,
        joined: new Date()
      });
    
    testUserId = user.id;

    // Setup routes with database connection
    setupRoutes(app, pg_db);
  });

  afterAll(async () => {
    // Clean up test data
    await pg_db('users').where('id', testUserId).del();
    await pg_db('login').where('email', 'profile@test.com').del();
    await pg_db.destroy();
  });

  it('should return 400 for invalid user ID', async () => {
    const response = await request(app).get('/profile/invalid_id');
    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for non-existent user', async () => {
    const response = await request(app).get('/profile/999999');
    expect(response.statusCode).toBe(400);
  });

  it('should return user data for valid ID', async () => {
    const response = await request(app).get(`/profile/${testUserId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id', testUserId);
    expect(response.body).toHaveProperty('name', 'Profile Test User');
    expect(response.body).toHaveProperty('entries', 5);
  });
});