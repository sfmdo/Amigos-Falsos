// db.js (Versión Final Corregida)

const { Pool } = require('pg');

// Vercel y Supabase inyectan la URL de conexión aquí
// Usamos la versión NON_POOLING para evitar problemas en Serverless
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL; 

if (!connectionString) {
    // Esto es solo una comprobación de seguridad, ya no debería ejecutarse
    throw new Error("ERROR: La variable POSTGRES_URL no está definida. Fallo de conexión."); 
}

const pool = new Pool({
    connectionString: connectionString,
    // La conexión remota requiere SSL
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    // Exportamos el método query, tal como lo hace tu código original
    query: (text, params) => pool.query(text, params),
};