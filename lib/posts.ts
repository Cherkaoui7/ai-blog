import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'app/blog/posts');

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  keyword: string;
  image: string;
  readTime: string;
  content: string;
};

export async function getAllPosts(): Promise<Post[]> {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

  const posts = files.map(filename => {
    const slug = filename.replace(/\.mdx?$/, '');
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
    const { data, content } = matter(raw);

    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      keyword: data.keyword || '',
      image: data.image || '',
      readTime: data.readTime || '5 min read',
      content,
    };
  });

  return posts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const extensions = ['.mdx', '.md'];
  for (const ext of extensions) {
    const filePath = path.join(POSTS_DIR, slug + ext);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title || slug,
        description: data.description || '',
        date: data.date || new Date().toISOString(),
        tags: data.tags || [],
        keyword: data.keyword || '',
        image: data.image || '',
        readTime: data.readTime || '5 min read',
        content,
      };
    }
  }
  return null;
}