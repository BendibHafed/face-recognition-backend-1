// Global test setup
process.env.NODE_ENV = 'test';

// Configure Jest to handle environment variables
require('dotenv').config({ path: '.test.env' });