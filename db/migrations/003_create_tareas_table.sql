-- Creación de la tabla de tareas
CREATE TABLE IF NOT EXISTS tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    curso_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_limite DATETIME NOT NULL,
    puntos INT DEFAULT 0,
    completada BOOLEAN DEFAULT FALSE,
    fecha_completacion DATETIME NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_tareas_curso_id ON tareas(curso_id);
CREATE INDEX idx_tareas_fecha_limite ON tareas(fecha_limite);

-- Insertar datos de ejemplo (opcional, para pruebas)
-- INSERT INTO tareas (curso_id, titulo, descripcion, fecha_limite, puntos) VALUES
-- (1, 'Tarea de ejemplo', 'Esta es una tarea de ejemplo', DATE_ADD(NOW(), INTERVAL 7 DAY), 10),
-- (1, 'Otra tarea', 'Descripción de la segunda tarea', DATE_ADD(NOW(), INTERVAL 3 DAY), 5);
