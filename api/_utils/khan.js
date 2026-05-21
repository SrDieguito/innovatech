// api/_utils/khan.js
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Builds a search query from title and description
 */
function buildQuery(titulo = '', descripcion = '') {
  const base = `${(titulo || '').trim()} ${(descripcion || '').trim()}`.replace(/\s+/g, ' ');
  return base.length > 20 ? base : (titulo || descripcion || 'matemáticas');
}

/**
 * Search Khan Academy using DuckDuckGo HTML results
 */
async function ddgSearch(query) {
  const q = encodeURIComponent(`site:es.khanacademy.org ${query}`);
  const url = `https://duckduckgo.com/html/?q=${q}`;
  
  try {
    const resp = await fetch(url, {
      headers: { 
        'User-Agent': UA, 
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      referrer: 'https://duckduckgo.com/'
    });
    
    if (!resp.ok) {
      console.error(`DDG search failed with status ${resp.status}`);
      return [];
    }
    
    const html = await resp.text();
    const $ = cheerio.load(html);
    const items = [];
    
    $('.result').each((_, el) => {
      const a = $(el).find('.result__a');
      const href = a.attr('href');
      const title = a.text().trim();
      const snippet = $(el).find('.result__snippet').text().trim();
      
      if (href && title) {
        // Normalize URL if it comes with /l/?kh=-1&uddg=...
        let urlFinal = href;
        try {
          const u = new URL(href, 'https://duckduckgo.com');
          if (u.searchParams.get('uddg')) {
            urlFinal = decodeURIComponent(u.searchParams.get('uddg'));
          }
        } catch (e) {
          console.error('Error normalizing URL:', e);
        }
        
        // Only Spanish KA pages
        if (/^https?:\/\/(www\.)?es\.khanacademy\.org/.test(urlFinal)) {
          items.push({ 
            url: urlFinal, 
            titulo: title, 
            resumen: snippet,
            source: 'DuckDuckGo',
            snippet: snippet
          });
        }
      }
    });
    
    return items;
  } catch (error) {
    console.error('Error in ddgSearch:', error);
    return [];
  }
}

/**
 * Fetches additional details from a Khan Academy URL
 */
async function fetchKAItem(url) {
  try {
    const resp = await fetch(url, {
      headers: { 
        'User-Agent': UA, 
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    
    if (!resp.ok) {
      console.error(`Failed to fetch KA item: HTTP ${resp.status} ${url}`);
      return null;
    }
    
    const html = await resp.text();
    const $ = cheerio.load(html);
    
    const h1 = $('h1').first().text().trim();
    const desc = $('meta[name="description"]').attr('content')?.trim() || '';
    
    // Extract useful internal links
    const links = [];
    $('a[href^="/"]')
      .slice(0, 8)
      .each((_, a) => {
        const href = $(a).attr('href');
        const text = $(a).text().trim().replace(/\s+/g, ' ');
        if (href && text && text.length > 2) {
          links.push({ 
            text, 
            url: `https://es.khanacademy.org${href}`,
            source: 'Khan Academy'
          });
        }
      });
    
    return {
      url,
      titulo: h1 || $('title').text().trim(),
      descripcion: desc,
      enlaces: links,
      source: 'Khan Academy'
    };
  } catch (error) {
    console.error(`Error fetching KA item ${url}:`, error);
    return null;
  }
}

/**
 * Main search function for Khan Academy content
 */
export async function khanSearchES(query, title = '', description = '') {
  const searchQuery = buildQuery(title, description);
  console.log(`Searching Khan Academy for: "${searchQuery}"`);
  
  try {
    // First try DuckDuckGo search
    const searchResults = await ddgSearch(searchQuery);
    
    if (!searchResults.length) {
      console.log('No results from DuckDuckGo, falling back to direct search');
      // Fallback to direct KA search
      const kaUrl = `https://es.khanacademy.org/search?referer=%2F&page_search_query=${encodeURIComponent(searchQuery)}`;
      return [{
        url: kaUrl,
        titulo: 'Ver más en Khan Academy',
        resumen: 'Resultados en KA (requiere navegación).',
        enlaces: [],
        source: 'Khan Academy (fallback)'
      }];
    }
    
    // Enrich top results with more details
    const enriched = [];
    for (const item of searchResults.slice(0, 4)) {
      try {
        const details = await fetchKAItem(item.url);
        if (details) {
          enriched.push({
            ...item,
            titulo: details.titulo || item.titulo,
            descripcion: details.descripcion || item.resumen,
            enlaces: details.enlaces || [],
            source: details.source || item.source
          });
        } else {
          enriched.push(item);
        }
      } catch (e) {
        console.error('Error enriching result:', e);
        enriched.push(item);
      }
    }
    
    return enriched;
  } catch (error) {
    console.error('Error in khanSearchES:', error);
    // Return a fallback result with the search URL
    return [{
      url: `https://es.khanacademy.org/search?referer=%2F&page_search_query=${encodeURIComponent(searchQuery)}`,
      titulo: 'Buscar en Khan Academy',
      resumen: 'No se pudieron cargar los resultados. Haz clic para buscar manualmente.',
      enlaces: [],
      source: 'Khan Academy (error)'
    }];
  }
}
