import mysql from "mysql2/promise";
import { Router } from "express";
import multer from "multer";
import xlsx from "xlsx";

import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 10,
});


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Obtener todos los cursos
router.get("/", async (req, res) => {
  try {
    const [cursos] = await pool.query(`
      SELECT c.*, u.nombre as profesor_nombre 
      FROM cursos c
      JOIN usuarios u ON c.profesor_id = u.id
    `);
    res.json(cursos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener cursos" });
  }
});

// Obtener profesores
router.get("/profesores", async (req, res) => {
  try {
    const [profesores] = await pool.query(
      'SELECT id, nombre FROM usuarios WHERE rol = "profesor"'
    );
    res.json(profesores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener profesores" });
  }
});

// Crear nuevo curso
router.post("/", async (req, res) => {
  const { nombre, descripcion, profesor_id } = req.body;
  
  if (!nombre || !profesor_id) {
    return res.status(400).json({ error: "Nombre y profesor son requeridos" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO cursos (nombre, descripcion, profesor_id) VALUES (?, ?, ?)",
      [nombre, descripcion, profesor_id]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear curso" });
  }
});

// Obtener estudiantes de un curso
router.get("/:cursoId/estudiantes", async (req, res) => {
  const { cursoId } = req.params;
  
  try {
    const [estudiantes] = await pool.query(`
      SELECT u.id, u.nombre, u.email 
      FROM usuarios u
      JOIN cursos_estudiantes ce ON u.id = ce.estudiante_id
      WHERE ce.curso_id = ?
    `, [cursoId]);
    res.json(estudiantes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener estudiantes" });
  }
});

// Matricular estudiantes en un curso
router.post("/:cursoId/estudiantes", async (req, res) => {
  const { cursoId } = req.params;
  const { estudiantes } = req.body;
  
  if (!estudiantes || !Array.isArray(estudiantes)) {
    return res.status(400).json({ error: "Lista de estudiantes requerida" });
  }

  try {
    // Verificar que el curso existe
    const [curso] = await pool.query("SELECT id FROM cursos WHERE id = ?", [cursoId]);
    if (!curso.length) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    // Convertir emails a IDs de usuario
    const placeholders = estudiantes.map(() => "?").join(",");
    const [usuarios] = await pool.query(
      `SELECT id FROM usuarios WHERE email IN (${placeholders})`,
      estudiantes
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: "No se encontraron usuarios con esos emails" });
    }

    const valores = usuarios.map(user => [cursoId, user.id]);
    
    await pool.query(
      "INSERT IGNORE INTO cursos_estudiantes (curso_id, estudiante_id) VALUES ?",
      [valores]
    );

    res.json({ message: "Estudiantes matriculados exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al matricular estudiantes" });
  }
});

// Desmatricular estudiantes de un curso
router.delete("/:cursoId/estudiantes", async (req, res) => {
  const { cursoId } = req.params;
  const { estudiantes } = req.body;
  
  if (!estudiantes || !Array.isArray(estudiantes)) {
    return res.status(400).json({ error: "Lista de estudiantes requerida" });
  }

  try {
    await pool.query(
      "DELETE FROM cursos_estudiantes WHERE curso_id = ? AND estudiante_id IN (?)",
      [cursoId, estudiantes]
    );
    res.json({ message: "Estudiantes desmatriculados exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al desmatricular estudiantes" });
  }
});

// Procesar archivo Excel
router.post("/procesar-excel", upload.single("archivo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se subió ningún archivo" });
  }

  try {
    const workbook = xlsx.read(req.file.buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(firstSheet);

    // Extraer emails de estudiantes (asumiendo columna 'email')
    const estudiantes = data.map(row => row.email).filter(email => email);
    
    res.json({ estudiantes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al procesar el archivo Excel" });
  }
});

export default router;