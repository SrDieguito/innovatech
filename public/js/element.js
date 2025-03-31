//Videojuegos
const htmlContent1 = `
        <h3 style="font-size: 26px; font-weight: bold;">Videojuegos</h3><img width="50" height="50"
            src="/imagenes/videogames.png" alt="icon-Videojuegos">
`

//ideacion
const htmlContent2 = `
    <h3 style="font-size: 26px; font-weight: bold;">Ideación</h3><img width="50" height="50" src="/imagenes/ideatech.png"
        alt="icon-Ideación">
`

//Prototipo 
const htmlContent3 = `
        <h3 style="font-size: 26px; font-weight: bold;">Prototipo</h3><img width="50" height="50"
        src="/imagenes/prototech.png" alt="icon-Prototipo">
`

const htmlContent4 = `
       <h3 style="font-size: 26px; font-weight: bold;">Conferencias y Negocios</h3><img width="50" height="50"
        src="/imagenes/conferencia.png" alt="icon-Conferencias y Negocios">
`

const htmlAlmuerzo = `
      <span class="event">Almuerzo</span><span class="time">hora
                                14:00</span>
            </div>
`




document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.h2Videojuegos').forEach(element => {
        element.innerHTML = htmlContent1
    })
    document.querySelectorAll('.h2Ideación').forEach(element => {
        element.innerHTML = htmlContent2
    })

    document.querySelectorAll('.h2Prototipo').forEach(element => {
        element.innerHTML = htmlContent3
    })

    document.querySelectorAll('.h2Conferencia').forEach(element => {
        element.innerHTML = htmlContent4
    })

    document.querySelectorAll('.almuerzo').forEach(element => {
        element.innerHTML = htmlAlmuerzo
    })

})