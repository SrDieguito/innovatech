const prototipos = [
    {
        "title": "Lanzamiento",
        "date": "25 julio"
    },
    {
        "title": "Promoción",
        "date": "30 Agosto"
    },
    {
        "title": "Inscripción",
        "date": "22 septiembre"
    },
    {
        "title": "Validación",
        "date": "29 septiembre"
    },
    {
        "title": "Mejoras técnicas modelos de negocio",
        "date": "30 octubre"
    },
    {
        "title": "Evaluación soluciones y reunion con inversores",
        "date": "18 y 19 noviembre"
    }
]

const ideas = [
    {
        "title": "Lanzamiento",
        "date": "25 julio"
    },
    {
        "title": "Promoción y capacitación metodología",
        "date": "15 septiembre"
    },
    {
        "title": "Inscripción",
        "date": "22 septiembre"
    },
    {
        "title": "Validación",
        "date": "29 septiembre"
    },
    {
        "title": "Tutorías técnicas modelo de negocio",
        "date": "30 octubre"
    },
    {
        "title": "BootCamp",
        "date": "18 y 19 noviembre"
    }
]


const lol = [
    {
        "title": "Lanzamiento oficial",
        "date": "25 julio"
    },
    {
        "title": "Socialización en redes sociales, publicación de las reglas y requisitos de participación",
        "date": "28 agosto"
    },
    {
        "title": "Visitas a colegios y universidades",
        "date": "23 a 27 septiembre"
    },
    {
        "title": "Inscripciones",
        "date": "01 a 25 octubre"
    },
    {
        "title": "Presentación de equipos y generación de llaves del torneo",
        "date": "15 noviembre"
    },
    {
        "title": "Etapa clasificatoria eliminatorias y semifinales",
        "date": "18 y 19 octubre"
    }
]


const createMetodosContainer = (metodos) => {
    const metodosContainer = document.createElement('div');
    metodosContainer.id = 'metodos';
    metodosContainer.className = 'container';

    metodos.forEach(metodo => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item metodo';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'title';
        titleSpan.textContent = metodo.title;

        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        dateSpan.textContent = metodo.date;

        itemDiv.appendChild(titleSpan);
        itemDiv.appendChild(dateSpan);
        metodosContainer.appendChild(itemDiv);
    });

    const imageDiv = document.createElement('div')
    imageDiv.innerHTML = `
        <div class='item metodo'>
            <img width="48" height="48" src="https://img.icons8.com/color/48/prize.png" alt="prize"/>
            <span class="date">20 noviembre</span>
        </div>
    `;
 
    metodosContainer.appendChild(imageDiv);

    return metodosContainer
}


document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('prototipo').appendChild(createMetodosContainer(prototipos))

    document.getElementById('ideas').appendChild(createMetodosContainer(ideas))

    document.getElementById('lol').appendChild(createMetodosContainer(lol))

})