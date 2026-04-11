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
    name: 'Abdessamad Cherkaoui',
    title: 'Full Stack Developer | AI & Automation Specialist',
    bio: 'Abdessamad builds scalable web applications and intelligent systems that solve real-world problems. Focusing on the MERN stack and applied AI, he designs automation tools that streamline workflows and prioritize clean architecture and performance.',
    expertise: ['Full Stack Development', 'Artificial Intelligence', 'Automation', 'MERN Stack'],
    avatar: '/images/authors/abdessamad-cherkaoui.jpg',
    twitter: '@acherkaoui_dev',
    linkedin: 'abdessamadcherkaoui',
    niche: 'tech',
  },
  {
    name: 'Karim Mansouri',
    title: 'Tech & Digital Life Writer',
    bio: 'Karim specializes in consumer technology and telecommunications, bringing a decade of enterprise tech experience from Casablanca. He translates complex digital systems and infrastructure into clear, actionable insights for everyday users and businesses.',
    expertise: ['Technology', 'Digital Life', 'Consumer Tech', 'Telecommunications'],
    avatar: '/images/authors/karim-mansouri.jpg',
    twitter: '@karimmansouri_tech',
    linkedin: 'karimmansouri',
    niche: 'tech',
  },
  {
    name: 'Salma Benkirane',
    title: 'Personal Finance Writer',
    bio: 'Salma is a personal finance specialist focused on wealth building, debt management, and the Moroccan economy. She develops practical financial frameworks and savings strategies designed to help individuals navigate local economic realities.',
    expertise: ['Personal Finance', 'Savings', 'Debt Management', 'Moroccan Economy'],
    avatar: '/images/authors/salma-benkirane.jpg',
    twitter: '@salmabenkirane_money',
    linkedin: 'salmabenkirane',
    niche: 'finance',
  },
  {
    name: 'Dr. Houda Alami',
    title: 'Health & Nutrition Writer',
    bio: 'Houda is a practicing nutritionist specializing in dietetics and public health. She focuses on culturally relevant wellness and nutrition strategies, analyzing the intersection of modern health science and traditional dietary practices.',
    expertise: ['Nutrition', 'Dietetics', 'Public Health', 'Wellness'],
    avatar: '/images/authors/houda-alami.jpg',
    twitter: '@drhouda_nutrition',
    linkedin: 'houdaalami',
    niche: 'health',
  },
  {
    name: 'Yassine El Fassi',
    title: 'Education Writer',
    bio: 'Yassine is an educational content strategist and former educator. He analyzes pedagogical systems and learning methodologies, providing strategic guidance for students and professionals navigating the complexities of modern education and skill development.',
    expertise: ['Education System', 'Student Guidance', 'Learning Strategies', 'Teaching'],
    avatar: '/images/authors/yassine-el-fassi.jpg',
    twitter: '@yassine_edu',
    linkedin: 'yassineelfassi',
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
