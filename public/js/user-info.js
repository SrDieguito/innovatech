  fetch('/api/perfil')
    .then(res => res.json())
    .then(data => {
      const nameParts = data.nombre.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const firstLastName = nameParts[1] || '';
      const initials = (firstName[0] || '') + (firstLastName[0] || '');

      document.getElementById('user-name').textContent = data.nombre.toUpperCase();
      document.getElementById('user-initials').textContent = initials.toUpperCase();
    })
    .catch(() => {
      document.getElementById('user-name').textContent = "USUARIO";
      document.getElementById('user-initials').textContent = "US";
    });
