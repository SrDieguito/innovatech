let isDarkMode = false;

function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode');

  const icon = document.getElementById('theme-icon');
  icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
}

function contactUs() {
  alert('¡Gracias por tu interés! Pronto nos pondremos en contacto contigo.');
}
