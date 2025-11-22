// db.js (Solución B: La Opción 'require')
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("ERROR: La variable de entorno de conexión a la base de datos no está definida.");
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      // Usar la opción 'require' para forzar la conexión SSL
        sslmode: 'require' 
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};