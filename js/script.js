// script.js
document.getElementById('perfil').addEventListener('change', function() {
    var otroPerfilBox = document.getElementById('otro-perfil-box');
    if (this.value === 'otro') {
        otroPerfilBox.style.display = 'block';
    } else {
        otroPerfilBox.style.display = 'none';
    }
});
