
const express = require('express');
const cors = require('cors');
const connection = require('./db.js');

const app = express();
app.use(cors());
app.use(express.json()); 

app.post("/api/registro", (req, res) => {
    const { nombre_usuario, correo_electronico, contrasena } = req.body;

    if (!nombre_usuario || !correo_electronico || !contrasena) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const sql = "INSERT INTO usuarios (nombre_usuario, correo_electronico, contrasena) VALUES (?, ?, ?)";
    
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
    // Ahora recibimos 'nombre_usuario' desde el frontend
    const { nombre_usuario, contrasena } = req.body;

    if (!nombre_usuario || !contrasena) {
        return res.status(400).json({ error: "Nombre de usuario y contraseña son obligatorios" });
    }

    const sql = "SELECT * FROM usuarios WHERE nombre_usuario = ?";
    
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

app.post("/api/amigosfalsos", (req, res) => {
    const { nombre, fecha, n_traicion, descripcion } = req.body;

    const sql = "INSERT INTO amigosfalsos (Nombre, Fecha, N_Traicion, Descripcion) VALUES (?, ?, ?, ?)";
    
    connection.query(sql, [nombre, fecha, n_traicion, descripcion], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
            mensaje: "Registro agregado correctamente", 
            id: result.insertId 
        });
    });
});


app.get("/api/amigosfalsos", (req, res) => {
    const sql = "SELECT * FROM amigosfalsos";
    
    connection.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        // El frontend recibirá un array de objetos con: { ID, Nombre, Fecha, N_Traicion, Descripcion }
        res.json(result);
    });
});


app.put("/api/amigosfalsos/:id", (req, res) => {
    const { id } = req.params;
    const { nombre, fecha, n_traicion, descripcion } = req.body;

    // Actualizamos los campos específicos de tu tabla
    const sql = "UPDATE amigosfalsos SET Nombre = ?, Fecha = ?, N_Traicion = ?, Descripcion = ? WHERE ID = ?";

    connection.query(sql, [nombre, fecha, n_traicion, descripcion, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Registro no encontrado" });
        } 
        
        res.json({ mensaje: `Registro con ID ${id} actualizado correctamente` });
    });
});

app.delete("/api/amigosfalsos/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM amigosfalsos WHERE ID = ?";

    connection.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Registro no encontrado" });
        }
        
        res.json({ mensaje: `Registro con ID ${id} eliminado correctamente` });
    });
});

app.use(express.static("public"));

// Puerto
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));