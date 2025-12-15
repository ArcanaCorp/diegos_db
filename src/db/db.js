import mysql from 'mysql2/promise';
import { HOST_DB, USER_DB, PASSWORD_DB, DATABASE_DB, PORT_DB } from '#src/config.js';

export const pool = mysql.createPool({
    host: HOST_DB || 'localhost',
    user: USER_DB || 'root',
    password: PASSWORD_DB || '',
    database: DATABASE_DB || 'diegos',
    port: PORT_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});