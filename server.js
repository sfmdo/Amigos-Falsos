
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 

const express = require('express');
const cors = require('cors');
const connection = require('./db.js');
const cookieParser = require('cookie-parser');
const app = express();
const path = require('path');

app.use(cors());
app.use(express.json()); 
app.use(express.static("public"));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const staticPath = path.join(__dirname, 'public', 'static');
app.use(express.static(staticPath));

const checkAuth = (req, res, next) => {
    const usuarioId = req.cookies.usuarioId;

    if (usuarioId) {
        req.usuarioId = usuarioId;
        next(); 
    } else {
        res.redirect('/login');
    }
};
//Rutas
app.get('/login', (req, res) => {
    res.render('login', { titulo: 'Iniciar Sesión' });
});

app.get('/registro', (req, res) => {
    res.render('registro', { titulo: 'Registro' });
});

app.get('/', checkAuth, (req, res) => {
    res.redirect('/mi-lista');
});

app.get('/mi-lista', checkAuth, (req, res) => {
    res.render('mi-lista', { titulo: 'Mi Lista' });
});

app.get('/comunidad', checkAuth, (req, res) => {
    res.render('Comunidad', { titulo: 'Comunidad' });
});

app.post("/api/registro", (req, res) => {
    const { nombre_usuario, correo_electronico, contrasena } = req.body;

    if (!nombre_usuario || !correo_electronico || !contrasena) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const sql = "INSERT INTO usuarios (nombre_usuario, correo_electronico, contrasena) VALUES ($1, $2, $3)";
    
    connection.query(sql, [nombre_usuario, correo_electronico, contrasena], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: "El nombre de usuario o correo electrónico ya existe." });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
            mensaje: "Usuario registrado correctamente", 
            id: result.insertId 
        });
    });
});

app.post("/api/login", (req, res) => {
    const { nombre_usuario, contrasena } = req.body;

    if (!nombre_usuario || !contrasena) {
        return res.status(400).json({ error: "Nombre de usuario y contraseña son obligatorios" });
    }

    const sql = "SELECT * FROM usuarios WHERE nombre_usuario = $1";
    
    connection.query(sql, [nombre_usuario], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const usuario = result[0];

        if (contrasena === usuario.contrasena) {
            res.json({
                mensaje: "Inicio de sesión exitoso",
                id: usuario.id 
            });
        } else {
            res.status(401).json({ error: "Contraseña incorrecta" });
        }
    });
});

app.get("/api/usuario/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT id, nombre_usuario FROM usuarios WHERE id = $1"
    connection.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
        res.json(result[0]);
    });
});

//Obtener lista de amigos falsos de 1 solo usuario
app.get("/api/amigosfalsos/usuario/:usuarioId", (req, res) => {
    const { usuarioId } = req.params;
    const sql = "SELECT * FROM AmigoFalso WHERE usuario_id = $1 ORDER BY N_Traicion DESC";
    connection.query(sql, [usuarioId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});


app.post("/api/amigosfalsos", (req, res) => {
    const { nombre, fecha, n_traicion, descripcion, usuario_id } = req.body;
    connection.query("SELECT nombre_usuario FROM usuarios WHERE id = $1", [usuario_id], (err, users) => {
        if (err || users.length === 0) {
            return res.status(500).json({ error: "No se pudo encontrar el autor del registro." });
        }
        const autorNombre = users[0].nombre_usuario;

        const sql = "INSERT INTO AmigoFalso (Nombre, Fecha, N_Traicion, Descripcion, usuario_id, AutorNombre) VALUES ($1, $2, $3, $4, $5, $6)";        
        connection.query(sql, [nombre, fecha, n_traicion, descripcion, usuario_id, autorNombre], (err, result) => {
            if (err) {
                console.error("Error al insertar la traición:", err);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ mensaje: "Registro agregado", id: result.insertId });
        });
    });
});


app.get("/api/amigosfalsos", (req, res) => {
    const sql = "SELECT * FROM AmigoFalso";
    
    connection.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});


app.put("/api/amigosfalsos/:id", (req, res) => {
    const { id } = req.params;
    const { nombre, fecha, n_traicion, descripcion } = req.body;

    const sql = "UPDATE AmigoFalso SET Nombre = $1, Fecha = $2, N_Traicion = $3, Descripcion = $4 WHERE ID = $5";

    connection.query(sql, [nombre, fecha, n_traicion, descripcion, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Registro no encontrado" });
        } 
        
        res.json({ mensaje: `Registro con ID ${id} actualizado correctamente` });
    });
});

app.patch("/api/amigosfalsos/publicar/:id", (req, res) => {
    const { id } = req.params;
    const { es_publico, es_anonimo } = req.body;
    const sql = "UPDATE AmigoFalso SET EsPublico = $1, EsAnonimo = $2 WHERE ID = $3";
    connection.query(sql, [es_publico, es_anonimo, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: "Estado de publicación actualizado" });
    });
});

app.delete("/api/amigosfalsos/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM AmigoFalso WHERE ID = $1";

    connection.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Registro no encontrado" });
        }
        
        res.json({ mensaje: `Registro con ID ${id} eliminado correctamente` });
    });
});

app.get("/api/amigosfalsos/comunidad", (req, res) => {
    const sql = `
    SELECT af.*, u.nombre_usuario AS autor 
    FROM AmigoFalso af
    JOIN usuarios u ON af.usuario_id = u.id
    WHERE af.EsPublico = TRUE
    ORDER BY af.Fecha DESC
    `;
    connection.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.use(express.static("public"));

// Puerto
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));