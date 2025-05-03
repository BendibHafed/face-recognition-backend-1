// Database tables creation 
const createTables = async(pg_db) => {
    try {
        // Check if usrs table exists
        const usersTableExists = await pg_db.schema.hasTable('users');
        if (!usersTableExists) {
            await pg_db.schema.createTable('login', (table) => {
                table.string('email').primary().notNullable();
                table.string('hash').notNullable();
            })
            .createTable('users', (table) => {
                table.increments('id').primary();
                table.string('name').notNullable();
                table.string('email').notNullable().unique()
                    .references('email').inTable('login').onDelete('CASCADE');
                table.integer('entries').defaultTo(0);
                table.timestamp('joined').defaultTo(pg_db.fn.now());
            });
            console.log('Tables created successfully!');
        } else {
            console.log('Tables already exists');
        }
    } catch (err) {
        console.error('Error creating tables:', err);
        throw err; // Re-throw to handle in server.js
    }
};

module.exports = { createTables }