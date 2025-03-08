require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(session({
    secret: 'clave_secreta',
    resave: false,
    saveUninitialized: true
}));

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pasantia'
};

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
    if (!req.session.user_id || req.session.user_rol !== 'admin') {
        return res.status(401).json({ error: 'Acceso no autorizado' });
    }
    next();
};

// Ruta para obtener usuarios según su estado
app.get('/usuarios', authMiddleware, async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [pendientes] = await connection.query("SELECT * FROM usuarios WHERE estado = 'pendiente'");
        const [aprobados] = await connection.query("SELECT * FROM usuarios WHERE estado = 'aprobado'");
        const [rechazados] = await connection.query("SELECT * FROM usuarios WHERE estado = 'rechazado'");
        connection.end();
        res.json({ pendientes, aprobados, rechazados });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Servir la página de administración
app.get('/admin', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});