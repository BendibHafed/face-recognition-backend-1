const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const knex = require('knex');
const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');

const app = express();

const pg_db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        port: 5432,
        user: 'postgres',
        password: '',
        database: 'smart-brain'
    }
});


// Middleware
app.use(express.json());
app.use(cors());

// Routes && Endpoints
app.post('/signin', (req, res) => {signin.handleSignin(req, res, pg_db, bcrypt)});

app.post('/register', (req, res) => {register.handleRegister(req, res, pg_db, bcrypt)});

app.get('/profile/:id', (req, res) => {profile.handleProfile(req, res, pg_db)});

app.post('/image', (req, res) => {image.handleImage(req, res, pg_db)});

// ----------------------------------- Server Runtime -------------------
app.listen(3000, () => {
    console.log('Application is running on port 3000');
})