const request = require('supertest');
const { app, setupRoutes } = require('../../app');
const knex = require('knex');
const bcrypt = require('bcryptjs');
const { createTables } = require('../../database');
const fetch = require('node-fetch');

jest.mock('node-fetch');

describe('POST /image', () => {
  let pg_db;
  let testUserId;
  const testImageUrl = 'http://example.com/image.jpg';
  const mockFaceData = {
    outputs: [{
      data: {
        regions: [{
          region_info: {
            bounding_box: {
              top_row: 0.1,
              left_col: 0.2,
              bottom_row: 0.3,
              right_col: 0.4
            }
          }
        }]
      }
    }]
  };

  beforeAll(async () => {
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

    await createTables(pg_db);

    const hash = bcrypt.hashSync('testpassword', 8);
    await pg_db('login').insert({ email: 'image@test.com', hash });
    const [user] = await pg_db('users')
      .returning('id')
      .insert({
        name: 'Test User',
        email: 'image@test.com',
        entries: 10,
        joined: new Date()
      });
    
    testUserId = user.id;
    setupRoutes(app, pg_db);
  });

  afterAll(async () => {
    await pg_db('users').where('id', testUserId).del();
    await pg_db('login').where('email', 'image@test.com').del();
    await pg_db.destroy();
  });

  beforeEach(() => {
    fetch.mockClear();
    jest.restoreAllMocks();
  });

  describe('Input Validation', () => {
    it('should return 400 if imageUrl is missing', async () => {
      const response = await request(app)
        .post('/image')
        .send({ id: testUserId });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('Image URL and user ID are required');
    });

    it('should return 400 if user ID is missing', async () => {
      const response = await request(app)
        .post('/image')
        .send({ imageUrl: testImageUrl });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('Image URL and user ID are required');
    });

    it('should return 400 if user ID is invalid', async () => {
      const response = await request(app)
        .post('/image')
        .send({ id: 'invalid_id', imageUrl: testImageUrl });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('Invalid user ID');
    });
  });

  describe('Successful Operations', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFaceData)
      });
    });

    it('should increment entries count', async () => {
      const initialUser = await pg_db('users').where('id', testUserId).first();
      const response = await request(app)
        .post('/image')
        .send({ id: testUserId, imageUrl: testImageUrl });
      const updatedUser = await pg_db('users').where('id', testUserId).first();
      expect(updatedUser.entries).toBe(initialUser.entries + 1);
      expect(response.statusCode).toBe(200);
    });

    it('should return face detection data', async () => {
      const response = await request(app)
        .post('/image')
        .send({ id: testUserId, imageUrl: testImageUrl });
      expect(response.body).toHaveProperty('faceData');
      expect(response.body.faceData).toEqual(mockFaceData.outputs[0]);
    });

    it('should make exactly one API call', async () => {
      await request(app)
        .post('/image')
        .send({ id: testUserId, imageUrl: testImageUrl });
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 if Clarifai API fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'API error' })
      });

      const response = await request(app)
        .post('/image')
        .send({ id: testUserId, imageUrl: testImageUrl });
      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe('Image processing failed');
    });

  
  });

  describe('Edge Cases', () => {
    it('should handle multiple face detections', async () => {
      const multiFaceData = {
        outputs: [{
          data: {
            regions: [
              { region_info: { bounding_box: {} } },
              { region_info: { bounding_box: {} } }
            ]
          }
        }]
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(multiFaceData)
      });

      const response = await request(app)
        .post('/image')
        .send({ id: testUserId, imageUrl: testImageUrl });
      expect(response.body.faceData.data.regions.length).toBe(2);
    });

    it('should handle empty face detection', async () => {
      const noFaceData = {
        outputs: [{
          data: {
            regions: []
          }
        }]
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(noFaceData)
      });

      const response = await request(app)
        .post('/image')
        .send({ id: testUserId, imageUrl: testImageUrl });
      expect(response.body.faceData.data.regions.length).toBe(0);
    });
  });
});