// db.js (Solución Final para Vercel/Supabase SSL)
const { Pool } = require('pg');

// Vercel inyecta automáticamente varias variables. 
// Usamos NON_POOLING porque es más estable en entornos Serverless.
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    throw new Error("ERROR: La variable de entorno de conexión a la base de datos no está definida en Vercel.");
}

const pool = new Pool({
    connectionString: connectionString,
    // --- ESTA ES LA CLAVE PARA SOLUCIONAR EL ERROR DE CERTIFICADO ---
    ssl: {
        // Le dice a Node.js que acepte certificados autofirmados o desconocidos.
        // Esto resuelve el "self-signed certificate in certificate chain"
        rejectUnauthorized: false
    }
});

module.exports = {
    // Exportamos el método query para usarlo en server.js
    query: (text, params) => pool.query(text, params),
};