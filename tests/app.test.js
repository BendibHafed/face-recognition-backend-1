const request = require('supertest');
const { app, setupRoutes } = require('../app');
const knex = require('knex');

describe('App Basic Tests', () => {
  let pg_db;

  beforeAll(async () => {
    // Create a mock database connection
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

    // Initialize routes with the mock database
    setupRoutes(app, pg_db);
  });

  afterAll(async () => {
    await pg_db.destroy();
  });

  it('should respond to GET / with 200 status', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Face Recognition Backend is running!');
  });

  it('should have CORS middleware enabled', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:5173');
    
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});