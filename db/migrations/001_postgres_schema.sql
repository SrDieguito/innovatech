-- ============================================================
-- InnovaTech – Schema inicial para PostgreSQL (Neon)
-- ============================================================

-- Tabla de migraciones
CREATE TABLE IF NOT EXISTS migrations (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(255) NOT NULL UNIQUE,
  run_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id                    SERIAL PRIMARY KEY,
  nombre                VARCHAR(255),
  email                 VARCHAR(255) UNIQUE,
  password              VARCHAR(255),
  telefono              VARCHAR(50),
  perfil                VARCHAR(100),
  organizacion          VARCHAR(255),
  cedula_ruc_pasaporte  VARCHAR(50),
  ubicacion             VARCHAR(255),
  fase                  VARCHAR(100),
  pitches               TEXT,
  deck                  TEXT,
  descripcion           TEXT,
  campo_accion          VARCHAR(255),
  procedencia           VARCHAR(255),
  imagen_perfil         TEXT,
  banner                TEXT,
  rol                   VARCHAR(50)  NOT NULL DEFAULT 'usuario',
  estado                VARCHAR(50)  NOT NULL DEFAULT 'pendiente',
  aprobado              BOOLEAN      NOT NULL DEFAULT FALSE,
  fecha_creacion        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  fecha_actualizacion   TIMESTAMPTZ
);

-- Temas (usados por recomendaciones)
CREATE TABLE IF NOT EXISTS temas (
  id     SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL
);

-- Cursos
CREATE TABLE IF NOT EXISTS cursos (
  id                  SERIAL PRIMARY KEY,
  nombre              VARCHAR(255) NOT NULL,
  descripcion         TEXT,
  profesor_id         INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  portada_url         TEXT,
  visibilidad         VARCHAR(50)  NOT NULL DEFAULT 'privado',
  estado              VARCHAR(50)  NOT NULL DEFAULT 'activo',
  fecha_creacion      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ
);

-- Estudiantes matriculados en cursos
CREATE TABLE IF NOT EXISTS cursos_estudiantes (
  id            SERIAL PRIMARY KEY,
  curso_id      INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  estudiante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE (curso_id, estudiante_id)
);

-- Tareas
CREATE TABLE IF NOT EXISTS tareas (
  id                SERIAL PRIMARY KEY,
  curso_id          INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo            VARCHAR(255) NOT NULL,
  descripcion       TEXT,
  fecha_creacion    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  fecha_limite      TIMESTAMPTZ,
  puntos            INTEGER      NOT NULL DEFAULT 0,
  completada        BOOLEAN      NOT NULL DEFAULT FALSE,
  fecha_completacion TIMESTAMPTZ,
  tema_id           INTEGER REFERENCES temas(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tareas_curso_id    ON tareas(curso_id);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_limite ON tareas(fecha_limite);

-- Entregas de tareas
CREATE TABLE IF NOT EXISTS tareas_entregas (
  id             SERIAL PRIMARY KEY,
  tarea_id       INTEGER NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  estudiante_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  archivo_nombre VARCHAR(255),
  archivo_mime   VARCHAR(100),
  archivo_blob   BYTEA,
  tamano_bytes   INTEGER,
  estado         VARCHAR(50)  NOT NULL DEFAULT 'entregado',
  fecha_entrega  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  calificacion   NUMERIC(5,2),
  observacion    TEXT
);

CREATE INDEX IF NOT EXISTS idx_entregas_tarea_id     ON tareas_entregas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_entregas_estudiante_id ON tareas_entregas(estudiante_id);

-- Comentarios (referenciados en el borrado en cascada de tareas)
CREATE TABLE IF NOT EXISTS comentarios (
  id           SERIAL PRIMARY KEY,
  tarea_id     INTEGER NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido    TEXT NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recomendaciones (referenciadas en el borrado en cascada de tareas)
CREATE TABLE IF NOT EXISTS recomendaciones (
  id           SERIAL PRIMARY KEY,
  tarea_id     INTEGER NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  titulo       TEXT,
  url          TEXT,
  snippet      TEXT,
  source       VARCHAR(100),
  score        NUMERIC(6,2),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
