document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/perfil')
    .then(res => res.json())
    .then(data => {
      // Mostrar nombre completo
      const userNameElement = document.getElementById('user-name');
      if (data && data.nombre) {
        userNameElement.textContent = data.nombre.toUpperCase();
      } else {
        userNameElement.textContent = "USUARIO DESCONOCIDO";
      }

      // Mostrar iniciales
      const initialsElement = document.getElementById('user-initials');
      if (data && data.nombre) {
        const palabras = data.nombre.trim().split(/\s+/);
        const iniciales = palabras.map(p => p[0].toUpperCase()).slice(0, 2).join('');
        initialsElement.textContent = iniciales;
      } else {
        initialsElement.textContent = "--";
      }
    })
    .catch(() => {
      document.getElementById('user-name').textContent = "USUARIO DESCONOCIDO";
      document.getElementById('user-initials').textContent = "--";
    });
});
