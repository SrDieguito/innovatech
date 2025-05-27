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

  // Generar iniciales
    const partes = nombre.trim().split(' ');
    let iniciales = '';
    if (partes.length >= 2) {
      iniciales = partes[0][0] + partes[1][0];
    } else if (partes.length === 1) {
      iniciales = partes[0][0];
    }

    const initialsElement = document.getElementById('user-initials');
    if (initialsElement) {
      initialsElement.textContent = iniciales.toUpperCase();
    }
  })
  .catch(error => {
    console.error('Error al obtener perfil:', error);
  });
});
