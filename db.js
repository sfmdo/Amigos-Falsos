// db.js
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("ERROR: La variable de entorno de conexión a la base de datos no está definida.");
}

const pool = new Pool({
    connectionString: connectionString,
    // Dejamos el objeto 'ssl: true' para indicar que la conexión es SSL,
    // pero la anulación global en server.js maneja la verificación.
    ssl: true 
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};