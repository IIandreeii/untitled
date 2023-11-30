const mysql = require('mysql2');
const { database } = require("./keys");
const { promisify } = require("util");

const pool = mysql.createPool(database);

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            throw new Error('Database Connection was Closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            throw new Error('Database has too many connections');
        }
        if (err.code === 'ECONNREFUSED') {
            throw new Error('Database connection was refused');
        }
    }

    if (connection) {
        connection.release();
        console.log('DB is Connected');
    }

    return;
});



pool.query=promisify(pool.query).bind(pool);
module.exports=pool;


