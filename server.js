const knex = require('knex');
require('dotenv').config();
const { app, setupRoutes } = require('./app');

const pg_db = knex({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'smart-brain'
    }
});

const startServer = async() => {

    try {
        // Check connection
        await pg_db.raw('SELECT 1');
        console.log('Database connected sucessfully');
        // Setup routes and Inject them with pg_db
        setupRoutes(app, pg_db);
        // Start server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        });
    
    } catch(err) {
        console.error('Failed to start the server: ', err.message);
        process.exit(1); // Exit with failure code
    }
};

// ----------------------------------- Start Server -------------------
startServer();
