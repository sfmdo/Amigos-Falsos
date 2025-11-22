const { Pool } = require('pg');

// 1. Preferir la URL de conexión completa si existe (es lo que inyecta Vercel)
const connectionString = process.env.DATABASE_URL;

let poolConfig;

if (connectionString) {
    // Si existe DATABASE_URL, úsala directamente. Esto es más robusto.
    poolConfig = {
        connectionString: connectionString,
        // Añadir SSL si la URL no lo especifica, ya que Vercel requiere SSL para DBs externas
        ssl: {
            rejectUnauthorized: false
        }
    };
} else {
    // Si DATABASE_URL no existe, usar las variables separadas (y verificar que existan)
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
        // Detener la ejecución si faltan variables críticas
        console.error("ERROR: Faltan variables de entorno para la conexión a la DB (DB_HOST, DB_USER, etc.).");
        // Lanza un error para que Vercel falle con un mensaje claro.
        throw new Error("Missing critical DB environment variables.");
    }

    poolConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432, // Usar 5432 por defecto si no está especificado
        ssl: {
            rejectUnauthorized: false
        }
    };
}

// 2. Inicializar el Pool con la configuración
const pool = new Pool(poolConfig);

// 3. Exportar el método query
module.exports = {
    query: (text, params) => pool.query(text, params),
};