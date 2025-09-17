// api/_utils/text.js
export const STOP_ES = new Set([
  'de','la','que','el','en','y','a','los','del','se','las','por','un','para','con','no','una',
  'su','al','lo','como','más','pero','sus','le','ya','o','este','sí','porque','esta','entre',
  'cuando','muy','sin','sobre','también','me','hasta','hay','donde','quien','desde','todo',
  'nos','durante','dos','uno','antes','ni','contra','e','ello','esto','estas','estos','esas',
  'esos','ser','es','son','fue','será','tema','tarea','actividad','trabajo','resumen','deber'
 ]);
 
 export function norm(str='') {
   return String(str)
     .normalize('NFKD').replace(/[\u0300-\u036f]/g,'') // sin acentos
     .toLowerCase();
 }
 
 export function tokens(str='') {
   return norm(str).replace(/[^a-z0-9\s]/g,' ')
     .split(/\s+/).filter(w => w && w.length>2 && !STOP_ES.has(w));
 }
 
 export function topKeywords(text, max=8) {
   const freq = new Map();
   for (const t of tokens(text)) freq.set(t,(freq.get(t)||0)+1);
   return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,max).map(([w])=>w);
 }
 