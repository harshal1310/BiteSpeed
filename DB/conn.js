const { Sequelize } = require('sequelize');
require('dotenv').config(); 


const dbNamePattern = /(^[a-z_][a-z0-9_]*$)|(^$)/;
const dbName = process.env.DB_NAME;

if (!dbNamePattern.test(dbName)) {
    throw new Error(`Database name "${dbName}" does not match the required pattern: /^[a-z_][a-z0-9_]*$/`);
}

/*
const sequelize = new Sequelize(
    dbName,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
        logging: false // Optional: Disable logging for cleaner output
    }
);*/

const sequelize = new Sequelize(process.env.DB_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // Change this based on your SSL certificate
        }
    },
    logging: false // Optional
});


// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = sequelize;
