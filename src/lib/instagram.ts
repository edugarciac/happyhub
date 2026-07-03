const INSTAGRAM_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || '';
const INSTAGRAM_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

export async function fetchInstagramPosts(limit = 9): Promise<InstagramPost[]> {
  if (!INSTAGRAM_TOKEN) return [];

  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=${INSTAGRAM_FIELDS}&limit=${limit}&access_token=${INSTAGRAM_TOKEN}`
    );
    if (!res.ok) {
      console.warn(`Instagram API returned status ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.data || []).filter(
      (p: InstagramPost) => p.media_type === 'IMAGE' || p.media_type === 'CAROUSEL_ALBUM'
    );
  } catch (err) {
    console.error('Instagram API error:', err);
    return [];
  }
}
