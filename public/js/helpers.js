// /public/js/helpers.js
// Minimalista y reutilizable

// Qs cortos
export function $(sel, ctx=document){ return ctx.querySelector(sel); }
export function $all(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }

// Crea un contenedor si no existe
export function ensureEl(idOrSel, {tag='div', parent=document.body, html=''} = {}){
  let el = idOrSel.startsWith('#') || idOrSel.startsWith('.') ? $(idOrSel) : document.getElementById(idOrSel);
  if(!el){
    el = document.createElement(tag);
    if(idOrSel.startsWith('#')) el.id = idOrSel.slice(1);
    else if(idOrSel.startsWith('.')) el.className = idOrSel.slice(1);
    el.innerHTML = html;
    parent.appendChild(el);
  }
  return el;
}

// Alertas simples (Tailwind)
export function showAlert(msg, type='info'){
  const colors = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warn: 'bg-yellow-500 text-black',
    info: 'bg-blue-600 text-white'
  };
  const bar = document.createElement('div');
  bar.className = `fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md shadow-lg z-[9999] ${colors[type]||colors.info}`;
  bar.textContent = msg;
  document.body.appendChild(bar);
  setTimeout(()=> bar.remove(), 3500);
}

// Fetch con manejo de errores y credenciales
export async function apiFetch(url, opts={}){
  const res = await fetch(url, {
    credentials: 'include', // importante para cookies de sesión
    headers: {'Content-Type':'application/json', ...(opts.headers||{})},
    ...opts
  });
  if(!res.ok){
    const text = await res.text().catch(()=> '');
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  // intenta JSON, sino texto
  const ct = res.headers.get('content-type')||'';
  return ct.includes('application/json') ? res.json() : res.text();
}
