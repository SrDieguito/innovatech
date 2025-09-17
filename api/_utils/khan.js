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
  const url = `https://es.khanacademy.org/search?query=${encodeURIComponent(query)}`;
  const html = await fetch(url, { headers:{'user-agent':'Mozilla/5.0 EducaTechBot'} }).then(r=>r.text());
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
