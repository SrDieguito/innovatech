-- Materiales de curso (PDFs, guías, etc.)
CREATE TABLE IF NOT EXISTS materiales (
  id             SERIAL PRIMARY KEY,
  curso_id       INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo         VARCHAR(255) NOT NULL,
  descripcion    TEXT,
  archivo_nombre VARCHAR(255),
  archivo_mime   VARCHAR(100),
  archivo_blob   BYTEA,
  tamano_bytes   INTEGER,
  tipo           VARCHAR(50) NOT NULL DEFAULT 'archivo', -- archivo | enlace
  url_externa    TEXT,
  orden          INTEGER NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materiales_curso_id ON materiales(curso_id);
