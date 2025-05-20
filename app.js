const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');

const app = express();
// Middleware
app.use(helmet());
app.use(express.json());

/* app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173' // frontend port
})); */

app.use(cors({
  origin: [
    'https://bendibhafed.github.io',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Routes && Endpoints
const setupRoutes = (app, pg_db)=> {
    app.get('/', (req, res) => res.send('Face Recognition Backend is running!'));
    app.post('/signin', (req, res) => {signin.handleSignin(req, res, pg_db, bcrypt)});
    app.post('/register', (req, res) => {register.handleRegister(req, res, pg_db, bcrypt)});
    app.get('/profile/:id', (req, res) => {profile.handleProfile(req, res, pg_db)});
    app.post('/image', (req, res) => {image.handleImage(req, res, pg_db)});
};
module.exports = { app, setupRoutes };
