import { apiFetch, showAlert, $ } from '/js/helpers.js';

export async function cargarUsuarioActual(){
  try {
    const user = await apiFetch('/api/auth/me'); // Asegúrate de que este endpoint exista
    window.currentUser = user; // {id, rol, nombre, ...}
    
    // Actualiza las iniciales del usuario en la interfaz si existe el elemento
    const headerInit = document.getElementById('user-initials');
    if (headerInit && user?.nombre) {
      const ini = user.nombre.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
      headerInit.textContent = ini;
    }
    return user;
  } catch (err) {
    window.currentUser = null;
    showAlert('No has iniciado sesión', 'warn');
    return null;
  }
}
