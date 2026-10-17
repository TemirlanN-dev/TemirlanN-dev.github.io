// Everything the site says lives here, so editing copy never means touching layout code.

export const SECTION_IDS = ['projects', 'experience', 'stats', 'about', 'contact'] as const
export type SectionId = (typeof SECTION_IDS)[number]

/** `command` is the line shown bottom-right while the item is highlighted. */
export type MenuItem = { id: SectionId | 'exit'; label: string; command: string }

export const MENU: MenuItem[] = [
  { id: 'projects', label: 'Projects', command: 'Browse my builds' },
  { id: 'experience', label: 'Experience', command: "See where I've worked" },
  { id: 'stats', label: 'Stats', command: 'Check my numbers' },
  { id: 'about', label: 'About', command: 'Meet the player' },
  { id: 'contact', label: 'Contact', command: 'Send a message' },
  { id: 'exit', label: 'Exit', command: 'Back to the arcade' },
]

export const PROFILE = {
  name: 'Temirlan Nurmambetov',
  role: 'Software engineer · UBC Computer Science',
  email: 'temirlann26@outlook.com',
  linkedin: 'https://www.linkedin.com/in/temirlan-n-b516b9243/',
  github: 'https://github.com/TemirlanN-dev',
}

export type Link = { label: string; href: string }

export type Project = {
  id: string
  name: string
  tagline: string
  language: string
  summary: string
  highlights: string[]
  stack: string[]
  links: Link[]
  team?: string
}

export const LANGUAGE_COLORS: Record<string, string> = {
  Go: '#00add8',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Java: '#b07219',
}

const repo = (path: string): Link => ({ label: 'Code', href: `https://github.com/${path}` })

export const PROJECTS: Project[] = [
  {
    id: 'cassette',
    name: 'cassette',
    tagline: 'LLM test recorder',
    language: 'Go',
    summary: 'An open-source CLI that records LLM API calls and replays them in tests.',
    highlights: [
      'Cuts a live Gemini request from 3.6 s to 20 ms at zero API cost; verified against the official OpenAI and Anthropic SDKs and shipped as v0.2.0.',
      'SHA-256 request fingerprinting over normalized JSON, with ignore and regex rules so recordings still match when prompts contain dates or random IDs.',
      'A semantic diff for re-recorded cassettes, API keys stripped from committed recordings, and 64 tests running in CI on Windows, macOS and Linux.',
    ],
    stack: ['Go', 'HTTP/SSE', 'Cobra', 'GitHub Actions'],
    links: [repo('TemirlanN-dev/cassette'), { label: 'Releases', href: 'https://github.com/TemirlanN-dev/cassette/releases' }],
  },
  {
    id: 'ante',
    name: 'Ante',
    tagline: 'Betting session tracker',
    language: 'JavaScript',
    summary:
      'An offline-first app for tracking live casino and sports betting sessions, with an analytics engine that ranks the habits costing you the most money.',
    highlights: [
      'Cut Analytics and Profile re-renders during live logging from 51 to 0 by splitting React Context into live-session and history providers.',
      'Sessions persist to AsyncStorage behind a 500 ms debounce, flush when the app is backgrounded, then sync to Supabase.',
      'Covered by 363 Jest tests across game logic, analytics and sync.',
    ],
    stack: ['React Native', 'Expo', 'Supabase', 'RevenueCat', 'Jest'],
    links: [repo('chancesong10/Ante')],
  },
  {
    id: 'cloud-media-pipeline',
    name: 'Cloud Media Pipeline',
    tagline: 'Serverless video transcoding',
    language: 'Python',
    summary: 'Videos upload straight to S3 through presigned URLs and trigger an on-demand FFmpeg worker on Fargate.',
    highlights: [
      'Direct-to-S3 uploads via 5-minute presigned URLs, so video bytes never touch the API server.',
      'An S3 event fires a Lambda that launches a Dockerized Python/FFmpeg worker on ECS Fargate: a 70 MB video becomes 720p in about 2 minutes and 93% smaller.',
      'Job status tracked in PostgreSQL; output served through CloudFront with Origin Access Control, keeping the bucket private.',
    ],
    stack: ['AWS S3', 'Lambda', 'ECS Fargate', 'CloudFront', 'Docker', 'Python', 'PostgreSQL', 'React'],
    links: [repo('TemirlanN-dev/cloud-media-pipeline-project')],
  },
  {
    id: 'allbookd',
    name: 'AllBookd',
    tagline: 'Book tracker',
    language: 'TypeScript',
    summary: 'A book tracker for exploring, wishlisting and logging what you read, without the clutter of older sites.',
    highlights: [
      'Book search backed by the Google Books API through Next.js route handlers.',
      'NYT bestseller lists matched to Google Books covers by ISBN and cached for 24 hours.',
      'Reading lists, wishlists and profiles with avatar upload, on Supabase auth.',
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Vercel'],
    links: [{ label: 'Live site', href: 'https://webapp-seven-teal.vercel.app' }, repo('chancesong10/AllBookd')],
    team: 'Built with a teammate (chancesong10).',
  },
  {
    id: 'learnio',
    name: 'Learnio',
    tagline: 'AI study tool · hackathon',
    language: 'Python',
    summary: 'Built in an 18-hour hackathon: turns an uploaded syllabus into a full practice exam in under a minute.',
    highlights: [
      'Gemini extracts the course name, modules and key topics from a syllabus as structured JSON.',
      'A FastAPI pipeline finds past exam PDFs via SerpAPI, parses them with PyPDF2 and feeds them back into Gemini to write multiple-choice and open-ended questions.',
      'A SQLite cache for courses, topics and questions cuts repeat API calls and works offline.',
    ],
    stack: ['Electron', 'TypeScript', 'Python', 'FastAPI', 'Gemini API', 'SQLite', 'Tailwind CSS'],
    links: [repo('chancesong10/Learnio')],
  },
  {
    id: 'roguelike',
    name: 'Roguelike',
    tagline: '2D game · UBC CPSC 210',
    language: 'Java',
    summary: 'A 2D roguelike with randomized stages and enemies, a shop, mystery stages for rare items, a final boss and permadeath.',
    highlights: [
      'Clear a stage, then choose: spend your gold in the shop, or risk a mystery stage for a rare item.',
      'Lose all your health and the run restarts from the beginning with freshly randomized enemies.',
      'Run stats saved to and loaded from JSON, with an event log and JUnit tests for the model and persistence layers.',
    ],
    stack: ['Java', 'Swing', 'JUnit', 'JSON'],
    links: [repo('TemirlanN-dev/UBC-CPSC-210-Term-Project')],
  },
]

export type Experience = {
  role: string
  org: string
  when: string
  note?: string
  bullets: string[]
  link?: Link
}

export const EXPERIENCE: Experience[] = [
  {
    role: 'Founder & Software Engineer',
    org: 'Ante',
    when: 'Aug 2026 – Present',
    bullets: [
      'Built a React Native (Expo) app for tracking live casino and sports betting sessions: offline-first, with a Supabase backend, RevenueCat subscriptions and a JavaScript analytics engine.',
      'Stopped Analytics and Profile from re-rendering during live logging (51 → 0 renders on a 300-session dataset) by splitting React Context into two providers.',
      '363 Jest tests across game logic, analytics and sync.',
    ],
  },
  {
    role: 'Software Developer',
    org: 'UBC Launch Pad',
    when: 'Sep 2026 – Present',
    bullets: [
      'Building a collaborative system-design platform in TypeScript where components like databases, queues and API gateways know their structural role, enabling automated architecture validation.',
      'Real-time collaboration: shared rooms, share links, live cursors and presence on an infinite canvas.',
      'Backend services in Go and PostgreSQL that store and serve boards and share links.',
    ],
  },
  {
    role: 'Open Source Contributor',
    org: 'Tiptap',
    when: 'Oct 2026',
    note: 'ProseMirror-based rich-text editor, 39k+ GitHub stars.',
    bullets: [
      'Built a round-trip test over 122 Markdown samples that uncovered an unreported data-loss bug: text with equality operators was wrongly highlighted and the operators silently deleted.',
      "Fixed the Highlight extension's Markdown parsing in TypeScript, with regression tests that fail on the original code. All 2,364 unit and 44 Playwright E2E tests pass.",
    ],
    link: { label: 'Pull request #8532', href: 'https://github.com/ueberdosis/tiptap/pull/8532' },
  },
  {
    role: 'B.Sc. Computer Science',
    org: 'University of British Columbia',
    when: 'Expected May 2028',
    note: 'GPA 4.0 / 4.33',
    bullets: [
      'Coursework: Data Structures and Algorithms, Object-Oriented Programming, Computer Systems, Software Construction, Data Science, Software Engineering, Algorithm Design and Analysis, Applied Machine Learning.',
    ],
  },
]

export const RECORDS = [
  { value: '3.6 s → 20 ms', label: 'LLM request replayed by cassette' },
  { value: '51 → 0', label: 'Wasted re-renders during live logging in Ante' },
  { value: '363', label: 'Jest tests in Ante' },
  { value: '93%', label: 'Smaller video out of the media pipeline' },
  { value: '2,364', label: 'Tiptap unit tests passing with my fix' },
  { value: '4.0 / 4.33', label: 'GPA at UBC' },
]

export const SKILLS = [
  { name: 'Languages', items: ['Python', 'Java', 'C++', 'Go', 'JavaScript', 'TypeScript', 'SQL'] },
  {
    name: 'Technologies',
    items: ['Next.js', 'React', 'Expo', 'Node.js', 'Tailwind CSS', 'PostgreSQL', 'FastAPI', 'SQLite', 'Java Swing', 'JUnit', 'Git', 'Docker', 'AWS', 'Jest'],
  },
  {
    name: 'Concepts',
    items: ['Agile Development', 'REST APIs', 'CI/CD', 'Unit Testing', 'Event-Driven Architecture', 'Container Orchestration', 'CDN Caching'],
  },
]

// Copied from the GitHub profile README (github.com/TemirlanN-dev).
export const ABOUT = {
  avatar: 'https://avatars.githubusercontent.com/u/62405040?v=4',
  heading: 'Hi there 👋, Welcome To My Profile Page',
  bullets: ['Exploring various fields of computer science', 'How to Reach Me: cdefrst58@gmail.com or temirlann26@outlook.com'],
  bio: 'Here to code 😎',
}
