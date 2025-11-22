
const express = require('express');
const cors = require('cors');
const { supabase } = require('./db.js');
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

app.post("/api/registro", async (req, res) => {
    const { nombre_usuario, correo_electronico, contrasena } = req.body;

    const { data, error } = await supabase
        .from('usuarios') 
        .insert([{ nombre_usuario, correo_electronico, contrasena }])
        .select('id') 
        .single(); 

    if (error) {
        if (error.code === '23505') { // Código de error de PostgreSQL para duplicado
            return res.status(409).json({ error: "El nombre de usuario o correo electrónico ya existe." });
        }
        return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json({ mensaje: "Usuario registrado correctamente", id: data.id });
});

app.post("/api/login", async (req, res) => {
    const { nombre_usuario, contrasena } = req.body;

    const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('nombre_usuario', nombre_usuario)
        .limit(1);

    if (error) return res.status(500).json({ error: error.message });
    if (!users || users.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = users[0];

    if (contrasena === usuario.contrasena) {
        res.json({ mensaje: "Inicio de sesión exitoso", id: usuario.id });
    } else {
        res.status(401).json({ error: "Contraseña incorrecta" });
    }
});

app.get("/api/usuario/:id", async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre_usuario')
        .eq('id', id) 
        .single(); 

    if (error) {
        // Supabase devuelve error si no encuentra el registro, lo mapeamos a 404
        if (error.code === 'PGRST116') { 
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        return res.status(500).json({ error: error.message });
    }
    
    // Supabase devuelve el objeto directamente en 'data' cuando se usa single()
    res.json(data); 
});

app.get("/api/amigosfalsos/usuario/:usuarioId", async (req, res) => {
    const { usuarioId } = req.params;
    
    const { data: amigos, error } = await supabase
        .from('amigofalso')
        .select('*')
        .eq('usuario_id', usuarioId) 
        .order('n_traicion', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    res.json(amigos);
});


app.post("/api/amigosfalsos", async (req, res) => {
    const { nombre, fecha, n_traicion, descripcion, usuario_id } = req.body;

    const { data: users, error: userError } = await supabase
        .from('usuarios')
        .select('nombre_usuario')
        .eq('id', usuario_id)
        .single();

    if (userError || !users) {
        return res.status(500).json({ error: "No se pudo encontrar el autor del registro." });
    }
    const autorNombre = users.nombre_usuario;
    
    const { data, error } = await supabase
        .from('amigofalso')
        .insert([{
            nombre, 
            fecha, 
            n_traicion, 
            descripcion, 
            usuario_id, 
            autornombre: autorNombre 
        }])
        .select('id') 
        .single();

    if (error) {
        console.error("Error al insertar la traición:", error.message);
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ mensaje: "Registro agregado", id: data.id });
});


app.get("/api/amigosfalsos", async (req, res) => {
    const { data: amigos, error } = await supabase
        .from('amigofalso')
        .select('*');

    if (error) return res.status(500).json({ error: error.message });
    
    res.json(amigos);
});


app.put("/api/amigosfalsos/:id", async (req, res) => {
    const { id } = req.params;
    const { nombre, fecha, n_traicion, descripcion } = req.body;

    // Supabase devuelve la cantidad de registros afectados en 'count'
    const { data, error, count } = await supabase
        .from('amigofalso')
        .update({ nombre, fecha, n_traicion, descripcion })
        .eq('id', id)
        .select()
        .limit(1)
        .maybeSingle();
        
    if (error) return res.status(500).json({ error: error.message });
        
    if (!data) {
        return res.status(404).json({ mensaje: "Registro no encontrado" });
    } 
    
    res.json({ mensaje: `Registro con ID ${id} actualizado correctamente` });
});

app.patch("/api/amigosfalsos/publicar/:id", async (req, res) => {
    const { id } = req.params;
    const { es_publico, es_anonimo } = req.body; // El cliente ya envía 0/1

    const { data, error } = await supabase
        .from('amigofalso')
        .update({ espublico: es_publico, esanonimo: es_anonimo })
        .eq('id', id);
        
    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ mensaje: "Estado de publicación actualizado" });
});

app.delete("/api/amigosfalsos/:id", async (req, res) => {
    const { id } = req.params;
    
    const { data, error, count } = await supabase
        .from('amigofalso')
        .delete()
        .eq('id', id)
        .limit(1)
        .select();

    if (error) return res.status(500).json({ error: error.message });
        
    if (data.length === 0) {
        return res.status(404).json({ mensaje: "Registro no encontrado" });
    }
    
    res.json({ mensaje: `Registro con ID ${id} eliminado correctamente` });
});

app.get("/api/amigosfalsos/comunidad", async (req, res) => {
    const { data: amigos, error } = await supabase
        .from('amigofalso')
        .select('*, usuarios(nombre_usuario)') 
        .eq('espublico', true)
        .order('fecha', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(amigos);
});

app.use(express.static("public"));

// Puerto
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));