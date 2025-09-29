// public/js/curso-boton-crear.js
const $ = (s, r=document) => r.querySelector(s);

function getCookie(name) {
  return document.cookie.split('; ').find(x => x.startsWith(name+'='))?.split('=')[1] || '';
}

async function whoami() {
  try {
    const r = await fetch('/api/perfil', { 
      credentials: 'include' 
    });
    if (r.ok) {
      const response = await r.json();
      if (response.id && response.rol) {
        return { 
          id: response.id, 
          rol: (response.rol || '').toLowerCase() 
        };
      }
    }
  } catch (error) {
    console.error('Error al verificar sesión:', error);
  }
  // Fallback por cookie
  const id = Number(getCookie('user_id') || 0);
  const rol = decodeURIComponent(getCookie('user_role') || '').toLowerCase();
  return id > 0 ? { id, rol } : null;
}

// Espera a que exista el botón
function waitFor(sel, timeout=5000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tick = () => {
      const el = $(sel);
      if (el) return resolve(el);
      if (Date.now() - t0 > timeout) return reject(new Error('timeout ' + sel));
      requestAnimationFrame(tick);
    };
    tick();
  });
}

// Obtener ID del curso de la URL
const params = new URLSearchParams(location.search);
const cursoId = Number(params.get('id') || 0);

// Inicialización
(async () => {
  let btn;
  try { 
    // Esperar a que exista el botón
    btn = await waitFor('#btn-crear-tarea'); 
  } catch (error) {
    console.warn('Botón de crear tarea no encontrado');
    return;
  }

  try {
    // Obtener información del usuario actual
    const me = await whoami();
    const canCreate = !!(me && ['profesor', 'admin'].includes(me.rol));

    // Mostrar/ocultar botón según el rol
    btn.classList.toggle('hidden', !canCreate);

    if (canCreate) {
      // Configurar el evento click
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `/profesor/nueva-tarea.html?curso_id=${cursoId}`;
      });
    }
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    // En caso de error, ocultar el botón por seguridad
    btn.classList.add('hidden');
  }
})();
