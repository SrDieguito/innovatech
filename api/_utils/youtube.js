const YT_API = 'https://www.googleapis.com/youtube/v3/search';

export async function buscarVideosYouTube(query, maxResults = 6) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null; // no key → use curated fallback

  const url = new URL(YT_API);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('relevanceLanguage', 'es');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('safeSearch', 'strict');
  url.searchParams.set('key', apiKey);

  const r = await fetch(url.toString());
  if (!r.ok) return null;

  const data = await r.json();
  if (!data.items?.length) return null;

  return data.items.map(item => ({
    titulo: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    desc: (item.snippet.description || '').slice(0, 160).trim() || item.snippet.channelTitle,
    canal: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || null,
    tipo: 'video',
    nivel: 'todos',
    fuente: 'youtube',
  }));
}
