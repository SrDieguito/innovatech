-- Eliminar filas duplicadas (dejar solo la más reciente por estudiante+tarea)
DELETE FROM tareas_entregas
WHERE id NOT IN (
  SELECT DISTINCT ON (tarea_id, estudiante_id) id
  FROM tareas_entregas
  ORDER BY tarea_id, estudiante_id, fecha_entrega DESC
);

-- Agregar constraint para prevenir duplicados futuros
ALTER TABLE tareas_entregas
  DROP CONSTRAINT IF EXISTS uq_entrega_tarea_estudiante;

ALTER TABLE tareas_entregas
  ADD CONSTRAINT uq_entrega_tarea_estudiante UNIQUE (tarea_id, estudiante_id);
