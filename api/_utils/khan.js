// api/_utils/khan.js
import * as cheerio from 'cheerio';
import { tokens } from './text.js';

function scoreItem(title, snippet, kwSet){
  const tksTitle = new Set(tokens(title));
  const tksSnip  = new Set(tokens(snippet||''));
  let s = 0;
  for (const k of kwSet) {
    if (tksTitle.has(k)) s += 3; // título pesa más
    if (tksSnip.has(k))  s += 1;
  }
  return s;
}

export async function khanSearchES(query, kw=[]) {
  console.log('Buscando en Khan Academy con query:', query);
  console.log('Palabras clave para puntuación:', kw);
  
  const url = `https://es.khanacademy.org/search?query=${encodeURIComponent(query)}`;
  console.log('URL de búsqueda:', url);
  
  let html;
  
  try {
    console.log('Realizando petición a Khan Academy...');
    const response = await fetch(url, { 
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'accept': 'text/html',
        'accept-language': 'es-ES,es;q=0.9',
      },
      referrer: 'https://es.khanacademy.org/',
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('Respuesta recibida. Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No se pudo obtener el texto de error');
      console.error('Error en la respuesta de Khan Academy:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorText
      });
      return [];
    }
    
    html = await response.text();
    console.log('HTML recibido. Longitud:', html.length, 'caracteres');
    
    // Guardar el HTML para depuración
    if (process.env.NODE_ENV === 'development') {
      const fs = await import('fs');
      const path = await import('path');
      const debugDir = path.join(process.cwd(), 'debug');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
      const debugFile = path.join(debugDir, `khan-debug-${Date.now()}.html`);
      fs.writeFileSync(debugFile, html);
      console.log('HTML guardado para depuración en:', debugFile);
    }
    
  } catch (err) {
    console.error('Error al realizar la petición a Khan Academy:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });
    return [];
  }
  
  const $ = cheerio.load(html);

  // Selectores tolerantes a cambios: tomamos anchors principales del listado
  const anchors = $('a[href^="/"] , a[href*="khanacademy.org"]')
    .filter((_,a)=>$(a).text().trim().length>0)
    .slice(0,80);

  const kwSet = new Set(kw);
  const items = [];

  anchors.each((_,a)=>{
    const $a = $(a);
    const title = $a.text().trim();
    let href = $a.attr('href')||'';
    if (href.startsWith('/')) href = 'https://es.khanacademy.org'+href;

    // descartes frecuentes
    if (!/^https:\/\/(es\.)?khanacademy\.org/.test(href)) return;
    if (/\/profile|\/sign(in|up)|\/donate|\/privacy|\/about/.test(href)) return;

    // buscamos un posible snippet cercano
    const parent = $a.closest('div,li,article');
    const snippet = parent.find('p').first().text().trim() || '';

    const score = scoreItem(title, snippet, kwSet);
    if (score>0) items.push({ titulo:title, url:href, snippet, source:'Khan Academy', score });
  });

  // únicos por URL y ordenados
  const uniq = [];
  const seen = new Set();
  for (const it of items.sort((a,b)=>b.score-a.score)) {
    if (seen.has(it.url)) continue;
    seen.add(it.url); uniq.push(it);
    if (uniq.length>=12) break;
  }
  return uniq;
}
