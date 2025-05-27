document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/perfil', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (!data || !data.nombre) throw new Error("Sin datos de usuario");

      const nombre = data.nombre.trim().toUpperCase();
      const parts = nombre.split(/\s+/);
      const iniciales = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');

      const userNameEl = document.getElementById('user-name');
      const userInitialsEl = document.getElementById('user-initials');

      if (userNameEl) userNameEl.textContent = nombre;
      if (userInitialsEl) userInitialsEl.textContent = iniciales;
    })
    .catch(() => {
      const userNameEl = document.getElementById('user-name');
      const userInitialsEl = document.getElementById('user-initials');

      if (userNameEl) userNameEl.textContent = "USUARIO DESCONOCIDO";
      if (userInitialsEl) userInitialsEl.textContent = "UD";
    });
});
