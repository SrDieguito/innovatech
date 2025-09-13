// api/_utils/text.js
export function slugify(str='') {
    return String(str)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 120);
  }
  
  export function tareaToTema({ titulo='', descripcion='' }) {
    const base = `${titulo} ${descripcion}`.trim();
    // Toma primeras 8-12 palabras "fuertes"
    const cleaned = base.replace(/\s+/g,' ').trim();
    const palabras = cleaned.split(' ').slice(0, 12).join(' ');
    const nombre = palabras || titulo || 'tema';
    const slug = slugify(nombre);
    return { slug, nombre };
  }
  