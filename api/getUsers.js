import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { estado } = req.query; // pendiente, aprobado, rechazado
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await pool.query('SELECT * FROM usuarios WHERE estado = ?', [estado]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error en la base de datos', details: error.message });
    }
}
