import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

router.get('/explorar_perfiles', async (req, res) => {
    if (!req.session || !req.session.user_id) {
        return res.redirect('/login');
    }

    try {
        const [user] = await pool.query('SELECT imagen_perfil FROM usuarios WHERE id = ?', [req.session.user_id]);
        const userProfilePic = user.length > 0 ? user[0].imagen_perfil : '';

        let searchQuery = req.query.search_query || '';
        let profilesQuery = 'SELECT id, nombre, perfil, imagen_perfil FROM usuarios';
        let profilesParams = [];

        if (searchQuery) {
            profilesQuery += ' WHERE nombre LIKE ? OR perfil LIKE ?';
            profilesParams = [`%${searchQuery}%`, `%${searchQuery}%`];
        }

        const [profiles] = await pool.query(profilesQuery, profilesParams);

        res.render('explorar_perfiles', {
            userProfilePic,
            profiles,
            searchQuery
        });
    } catch (error) {
        console.error('Error al obtener los perfiles:', error);
        res.status(500).send('Error interno del servidor');
    }
});

export default router;
