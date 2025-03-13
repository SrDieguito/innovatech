import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { id, estado } = req.body; // estado: aprobado o rechazado
        if (!id || !['aprobado', 'rechazado'].includes(estado)) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        await pool.query('UPDATE usuarios SET estado = ? WHERE id = ?', [estado, id]);
        res.status(200).json({ message: `Usuario ${estado}` });
    } catch (error) {
        res.status(500).json({ error: 'Error en la base de datos', details: error.message });
    }
}
