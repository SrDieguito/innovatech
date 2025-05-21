const htmlContent = `
  <div>
        <header class="sc-400fb3e-0 bWWaGg">
            <div class="sc-c592f796-0 chTJIG">
                <div class="TabGroup__Container-sc-1k1eo94-0 eIWsfq sc-c592f796-1 ktHNXA">
                    <img src="/imagenes/UTM-logo.gif" alt="UTM-logo" width="200">
                    <div class="TabGroup__Wrapper-sc-1k1eo94-1 bDzWUZ">
                    </div>
                </div>
            </div>
            <div class="sc-3c285138-0 euyxOI ml-8 d-none d-laptop-flex">
                <div class="sc-3c285138-2 gzCmhI hide-empty" id="">
                    <button type="button" class="Button__StyledButton-sc-1gfts8g-0 gMZAES" onclick="iniciarSesion()">Iniciar sesión</button>
                </div>
            </div>
            <div class="sc-3c285138-0 euyxOI ml-auto d-none d-tablet-flex d-laptop-none">
                <div class="sc-3c285138-2 gzCmhI hide-empty">
                    <button type="button" class="Button__StyledButton-sc-1gfts8g-0 gMZAES" onclick="iniciarSesion()">Iniciar sesión</button>
                </div>
            </div>
            <div class="sc-3f224cfc-0 iBuIbN ml-24 mr-16 d-none d-tablet-flex d-laptop-none">
                <button type="button" aria-label="Abrir navegación"
                    class="IconButton__StyledIconButton-sc-o4nnl7-0 dMqGsV">
                    <svg color="rgba(35, 35, 35, 1)" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true"
                        class="Icon-sc-2q4m72-0 ktcoGv">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M2 6C2 5.44772 2.44772 5 3 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H3C2.44772 7 2 6.55228 2 6ZM2 12C2 11.4477 2.44772 11 3 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H3C2.44772 13 2 12.5523 2 12ZM3 17C2.44772 17 2 17.4477 2 18C2 18.5523 2.44772 19 3 19H21C21.5523 19 22 18.5523 22 18C22 17.4477 21.5523 17 21 17H3Z"
                            fill="currentColor"></path>
                    </svg>
                </button>
            </div>
            <div class="sc-3f224cfc-0 iBuIbN ml-auto mr-16 d-tablet-none">
                <button type="button" aria-label="Abrir navegación"
                    class="IconButton__StyledIconButton-sc-o4nnl7-0 dMqGsV">
                    <svg color="rgba(35, 35, 35, 1)" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true"
                        class="Icon-sc-2q4m72-0 ktcoGv">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M2 6C2 5.44772 2.44772 5 3 5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H3C2.44772 7 2 6.55228 2 6ZM2 12C2 11.4477 2.44772 11 3 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H3C2.44772 13 2 12.5523 2 12ZM3 17C2.44772 17 2 17.4477 2 18C2 18.5523 2.44772 19 3 19H21C21.5523 19 22 18.5523 22 18C22 17.4477 21.5523 17 21 17H3Z"
                            fill="currentColor"></path>
                    </svg>
                </button>
            </div>
        </header>
        <div class="sc-33f09716-0 gtMYgZ">
            <div class="TabGroup__Container-sc-1k1eo94-0 eIWsfq w-100">
                <div class="TabGroup__Wrapper-sc-1k1eo94-1 YAXmj">
                    <a class="TabLink__TabAnchor-sc-e9hfzw-0 bATmFG text-uppercase px-24 px-tablet-40"
                        id="btnNav_Inicio" href="./index.html" tabindex="0">Inicio</a>
                    <a class="TabLink__TabAnchor-sc-e9hfzw-0 bATmFG text-uppercase px-24 px-tablet-40"
                        id="btnNav_Metodologia" href="./metodologias.html" tabindex="0">¿Quiénes somos?</a>
                    <a class="TabLink__TabAnchor-sc-e9hfzw-0 bATmFG text-uppercase px-24 px-tablet-40" id="btnNav_Retos"
                        href="./retos.html" tabindex="0">¿Cómo funciona?</a>
                    <a class="TabLink__TabAnchor-sc-e9hfzw-0 bATmFG text-uppercase px-24 px-tablet-40"
                        id="btnNav_Actividades" href="./agenda.html" tabindex="0">FAQS</a>
                </div>
            </div>
        </div>
    </div>
`;

function iniciarSesion() {
    window.location.href = '/auth/login.html';
}

var contenteaders = (id) => {
    document.getElementById(id).innerHTML = htmlContent;
};
contenteaders("header");
