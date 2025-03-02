const contentHtml = (index, title, content, url) => {

    return `
       <div class="fade-in-left retos container">
                <div>
                    <div class="items_r">
                        <label style="font-size: 100px; font-weight: bold;">${index}</label>
                        <h3 style="font-weight: bold; font-size: 30px; position: relative; top:-30px;text-transform: capitalize;">${title}</h3>
                    </div>
                    <label style="font-size: 14px;" >
                    ${content}
                    </label>
                </div>
                <img src='${url}' width="350"
                    height="350" style="border-radius: 15px;" />
            </div>

    `
}

//Seguridad
const contentSeg = `Soluciones relacionadas con: Ciberseguridad urbana, alertas tempranas, vigilancia inteligente,y Seguridad Ciudadana con tecnología disruptiva.`

const urlSeg = "https://i.pinimg.com/564x/68/8e/b9/688eb9f10744db8d80e2dd7e3021d2de.jpg"


// Empleo
const contentEmp = `Soluciones en el campo de la economía digital, en la cual al uso de las tecnologías de la  información mejore los procesos de producción de bienes y servicios, así como en su comercialización y consumo`

const urlEmp = `https://i.pinimg.com/564x/5a/34/3f/5a343f53cb1e3e35d17b57404246727d.jpg`

//Salud
const contentSal = `Soluciones para dinamizar la transformación digital y optimizar los proceso de atención de salud de los prestadores de servicio público y/o privado`

const urlSal = `https://i.pinimg.com/564x/91/cf/3a/91cf3a7d29373291d728708a72e7e84a.jpg`

//Arquitectura 
const contentArq = `Soluciones de agricultura y/o ganadería, en el marco de que mejora productiva en las zonas de influencia`

const urlArq = `https://i.pinimg.com/564x/c9/8f/40/c98f40da3f448fade51656d312a46884.jpg`

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('seguridad').innerHTML = contentHtml("01", "seguridad", contentSeg, urlSeg)

    document.getElementById('empleo').innerHTML = contentHtml('02', "empleo", contentEmp, urlEmp)

    document.getElementById('salud').innerHTML = contentHtml('03',"salud",contentSal,urlSal)

    document.getElementById('arquitectura').innerHTML = contentHtml('04',"arquitectura",contentArq,urlArq)
})