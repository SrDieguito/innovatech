document.addEventListener("DOMContentLoaded", async function () {
  try {
      const response = await fetch("/api/getUserProfile", {
          method: "GET",
          credentials: "include", // Asegura que se envíen las cookies de autenticación
      });
      
      if (!response.ok) {
          throw new Error("Error al obtener los datos del usuario");
      }
      
      const user = await response.json();
      
      document.getElementById("user-name").textContent = user.nombre;
      document.getElementById("user-email").textContent = user.email;
      document.getElementById("user-phone").textContent = user.telefono;
      document.getElementById("user-organization").textContent = user.organizacion;
      document.getElementById("user-profile").textContent = user.perfil;
      document.getElementById("user-location").textContent = user.ubicacion;
      document.getElementById("user-phase").textContent = user.fase;
      document.getElementById("user-deck").textContent = user.deck;
      document.getElementById("user-origin").textContent = user.procedencia;
      document.getElementById("user-action-field").textContent = user.campo_accion;
      document.getElementById("user-description").textContent = user.descripcion;
      
      document.getElementById("profile-image").src = user.imagen_perfil || "/imagenes/default-profile.png";
      document.getElementById("banner-image").src = user.banner || "/imagenes/default-banner.jpg";
  } catch (error) {
      console.error("Error al cargar el perfil: ", error);
  }

  // Actualizar descripción
  document.getElementById("update-description-form").addEventListener("submit", async function (e) {
      e.preventDefault();
      const description = document.getElementById("description").value;
      
      try {
          const response = await fetch("/api/updateUserDescription", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ descripcion: description })
          });
          
          if (response.ok) {
              alert("Descripción actualizada correctamente");
              document.getElementById("user-description").textContent = description;
          } else {
              throw new Error("Error al actualizar la descripción");
          }
      } catch (error) {
          console.error(error);
      }
  });

  // Cambiar imagen de perfil
  document.getElementById("profile-image-upload").addEventListener("change", async function () {
      const file = this.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append("profile_image", file);
      
      try {
          const response = await fetch("/api/updateProfileImage", {
              method: "POST",
              credentials: "include",
              body: formData
          });
          
          if (response.ok) {
              const data = await response.json();
              document.getElementById("profile-image").src = data.imagen_perfil;
              alert("Imagen de perfil actualizada");
          } else {
              throw new Error("Error al actualizar la imagen de perfil");
          }
      } catch (error) {
          console.error(error);
      }
  });

  // Cambiar imagen del banner
  document.getElementById("banner-upload").addEventListener("change", async function () {
      const file = this.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append("banner_image", file);
      
      try {
          const response = await fetch("/api/updateBannerImage", {
              method: "POST",
              credentials: "include",
              body: formData
          });
          
          if (response.ok) {
              const data = await response.json();
              document.getElementById("banner-image").src = data.banner;
              alert("Imagen de banner actualizada");
          } else {
              throw new Error("Error al actualizar la imagen del banner");
          }
      } catch (error) {
          console.error(error);
      }
  });
});
