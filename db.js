// db.js (Solución simple para entornos de prueba)
const { Pool } = require('pg');

// Usamos las variables que Vercel inyecta
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("ERROR: La variable de entorno de conexión a la base de datos no está definida.");
}

const pool = new Pool({
    connectionString: connectionString,
    // --- La configuración necesaria para entornos sin certificados CA ---
    ssl: {
        // Esta es la opción estándar para decirle a pg que no se preocupe por el certificado CA.
        rejectUnauthorized: false 
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};