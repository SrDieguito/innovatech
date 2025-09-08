// wsServer.js
import WebSocket from 'ws';

/* ====================
   Inicialización WS
==================== */
let wss;
const conexiones = new Map(); // Map de tarea_id -> lista de sockets

export function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws/tareas' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const tareaId = url.searchParams.get('tarea_id');
    if (!tareaId) {
      ws.close();
      return;
    }

    if (!conexiones.has(tareaId)) conexiones.set(tareaId, []);
    conexiones.get(tareaId).push(ws);

    ws.on('close', () => {
      const lista = conexiones.get(tareaId) || [];
      conexiones.set(tareaId, lista.filter(s => s !== ws));
    });
  });

  console.log('WebSocket inicializado en /ws/tareas');
}

/* ====================
   Función para emitir actualizaciones
==================== */
export function emitirActualizacion(tareaId, datos) {
  if (!conexiones.has(tareaId)) return;
  conexiones.get(tareaId).forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'actualizacion_tarea',
        tarea_id: tareaId,
        ...datos
      }));
    }
  });
}
