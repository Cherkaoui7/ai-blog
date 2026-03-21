import { supabaseAdmin, supabase } from './supabase';

export type PostRecord = {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  keyword?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'failed';
  image_url?: string;
  read_time?: string;
  word_count?: number;
  views?: number;
  revenue?: number;
  published_at?: string;
};

// ── READ (public, uses anon key) ──────────────────────────────

export async function getPublishedPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data as PostRecord[];
}

export async function getPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data as PostRecord;
}

// ── WRITE (agents only, uses service role key) ────────────────

export async function createPost(post: PostRecord) {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert(post)
    .select()
    .single();
  if (error) throw error;
  return data as PostRecord;
}

export async function updatePostStatus(
  slug: string,
  status: 'draft' | 'published' | 'failed'
) {
  const { error } = await supabaseAdmin
    .from('posts')
    .update({
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .eq('slug', slug);
  if (error) throw error;
}

export async function incrementViews(slug: string) {
  const { error } = await supabaseAdmin.rpc('increment', {
    table_name: 'posts',
    column_name: 'views',
    slug,
  });
  if (error) {
    // Fallback: simple update
    const post = await getPostBySlug(slug);
    if (post) {
      await supabaseAdmin
        .from('posts')
        .update({ views: (post.views || 0) + 1 })
        .eq('slug', slug);
    }
  }
}

// ── ANALYTICS ─────────────────────────────────────────────────

export async function getStats() {
  const { data } = await supabaseAdmin
    .from('posts')
    .select('status, views, revenue, word_count');

  const posts = data || [];
  return {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    totalViews: posts.reduce((s, p) => s + (p.views || 0), 0),
    totalRevenue: posts.reduce((s, p) => s + (p.revenue || 0), 0),
    avgWordCount: Math.round(
      posts.reduce((s, p) => s + (p.word_count || 0), 0) / (posts.length || 1)
    ),
  };
}