export type Author = {
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  avatar: string;
  twitter: string;
  linkedin: string;
  niche: 'tech' | 'finance' | 'health' | 'education';
};

export const authors: Author[] = [
  {
    name: 'Marcus Chen',
    title: 'Senior Software Engineer',
    bio: 'Marcus has spent 12 years building products at startups and Fortune 500 companies. He specializes in AI/ML systems, cloud architecture, and developer tooling — and he still mass-deploys side projects on weekends.',
    expertise: ['Artificial Intelligence', 'Cloud Architecture', 'Web Development', 'Developer Tools'],
    avatar: '/images/authors/marcus-chen.jpg',
    twitter: '@marcuschen_dev',
    linkedin: 'marcuschen',
    niche: 'tech',
  },
  {
    name: 'Sarah Mitchell',
    title: 'Certified Financial Planner (CFP®)',
    bio: 'Sarah grew up in a paycheck-to-paycheck household and became obsessed with making money work smarter. After earning her CFP® certification, she\'s helped hundreds of clients build wealth on any income.',
    expertise: ['Personal Finance', 'Investing', 'Budgeting', 'Retirement Planning'],
    avatar: '/images/authors/sarah-mitchell.jpg',
    twitter: '@sarahmitchell_money',
    linkedin: 'sarahmitchellcfp',
    niche: 'finance',
  },
  {
    name: 'Dr. Aisha Patel',
    title: 'Certified Nutritionist & Personal Trainer',
    bio: 'Aisha holds a doctorate in nutrition science and is an NASM-certified personal trainer. She blends clinical research with real-world coaching to help people feel strong and energized without fad diets.',
    expertise: ['Nutrition', 'Exercise Science', 'Mental Health', 'Wellness'],
    avatar: '/images/authors/aisha-patel.jpg',
    twitter: '@aisha_fitsmart',
    linkedin: 'aishapatelhealth',
    niche: 'health',
  },
  {
    name: 'James Ortega',
    title: 'Curriculum Designer & Former Educator',
    bio: 'James spent 8 years teaching high-school science before moving into curriculum design. He now focuses on making complex subjects accessible through clear, step-by-step guides anyone can follow.',
    expertise: ['Education', 'How-to Guides', 'Skill Building', 'Learning Strategies'],
    avatar: '/images/authors/james-ortega.jpg',
    twitter: '@jamesortega_edu',
    linkedin: 'jamesortegaedu',
    niche: 'education',
  },
];

const nicheKeywords: Record<Author['niche'], string[]> = {
  tech: [
    'ai', 'artificial intelligence', 'machine learning', 'programming', 'software',
    'code', 'developer', 'web dev', 'api', 'cloud', 'devops', 'algorithm',
    'tech', 'computer', 'data science', 'cybersecurity', 'blockchain', 'saas',
    'app', 'framework', 'react', 'next.js', 'python', 'javascript', 'llm',
  ],
  finance: [
    'money', 'finance', 'invest', 'budget', 'saving', 'income', 'debt',
    'credit', 'tax', 'retirement', 'stock', 'crypto', 'bank', 'mortgage',
    'frugal', 'wealth', 'salary', 'side hustle', 'passive income', 'financial',
    'finops', 'cost management', 'cost intelligence', 'spend', 'pricing',
  ],
  health: [
    'health', 'fitness', 'nutrition', 'exercise', 'diet', 'mental health',
    'workout', 'weight loss', 'sleep', 'stress', 'wellness', 'yoga',
    'meditation', 'protein', 'calories', 'muscle', 'cardio', 'supplement',
  ],
  education: [
    'learn', 'study', 'education', 'how to', 'guide', 'tutorial', 'skill',
    'course', 'productivity', 'career', 'resume', 'interview', 'writing',
    'reading', 'teaching', 'certification', 'self-improvement', 'habit',
  ],
};

export function detectNiche(topic: string): Author['niche'] {
  const lower = topic.toLowerCase();
  const scores: Record<Author['niche'], number> = { tech: 0, finance: 0, health: 0, education: 0 };

  for (const [niche, keywords] of Object.entries(nicheKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[niche as Author['niche']] += 1;
      }
    }
  }

  const best = (Object.entries(scores) as [Author['niche'], number][])
    .sort((a, b) => b[1] - a[1])[0];

  return best[1] > 0 ? best[0] : 'education'; // fallback to education (general how-to)
}

export function getAuthorByNiche(niche: string): Author {
  const detected = detectNiche(niche);
  return authors.find(a => a.niche === detected) || authors[3]; // fallback James
}

export function getAuthorByNicheKey(niche: Author['niche']): Author {
  return authors.find(a => a.niche === niche) || authors[3];
}
