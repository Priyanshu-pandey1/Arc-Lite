/**
 * Lightweight sample data used until the Flask + PostgreSQL backend exists.
 * UI components never import this file directly — they go through
 * services/chatService.js so the swap to real APIs is a one-file change.
 */

const now = Date.now()
const minutes = (n) => now - n * 60_000

export const sampleConversations = [
  {
    id: 'conv-1',
    title: 'Simple Greeting and Introduction',
    pinned: false,
    group: 'Today',
    messages: [
      { id: 'msg-1', role: 'user', text: 'hi', createdAt: minutes(42) },
      { id: 'msg-2', role: 'assistant', text: 'Hi! How can I help?', createdAt: minutes(42) },
    ],
  },
  {
    id: 'conv-2',
    title: 'How do I enroll in a course?',
    pinned: false,
    group: 'Today',
    messages: [
      { id: 'msg-3', role: 'user', text: 'How do I enroll in a course?', createdAt: minutes(120) },
      {
        id: 'msg-4',
        role: 'assistant',
        text: 'To enroll in a course, open the Courses section from your ArchintX dashboard, pick the course you want, and click "Enroll Now". You will get a confirmation email once your seat is reserved.',
        createdAt: minutes(120),
        source: { category: 'Courses', confidence: 0.94 },
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Certificate verification steps',
    pinned: true,
    group: 'Today',
    messages: [
      { id: 'msg-5', role: 'user', text: 'How can I verify my certificate?', createdAt: minutes(300) },
      {
        id: 'msg-6',
        role: 'assistant',
        text: 'Every ArchintX certificate carries a unique verification ID. Paste that ID on the Certificate Verification page to confirm authenticity, or share the verification link with an employer — it shows the holder name, course, grade, and issue date.',
        createdAt: minutes(300),
        source: { category: 'Certificates', confidence: 0.91 },
      },
    ],
  },
  {
    id: 'conv-4',
    title: 'Job portal access after completion',
    pinned: false,
    group: 'Yesterday',
    messages: [
      { id: 'msg-7', role: 'user', text: 'Do I get access to the job portal?', createdAt: minutes(1_500) },
      {
        id: 'msg-8',
        role: 'assistant',
        text: 'Yes — completing any ArchintX path unlocks the job portal. You can build a profile, browse open roles, and apply directly. Placement support is included for verified learners.',
        createdAt: minutes(1_500),
        source: { category: 'Jobs', confidence: 0.89 },
      },
    ],
  },
  {
    id: 'conv-5',
    title: 'Reset my account password',
    pinned: false,
    group: 'Yesterday',
    messages: [
      { id: 'msg-9', role: 'user', text: 'I forgot my password', createdAt: minutes(2_800) },
      {
        id: 'msg-10',
        role: 'assistant',
        text: 'Click "Forgot password?" on the login screen, enter the email registered with your account, and follow the reset link we email you. The link expires in 15 minutes for security.',
        createdAt: minutes(2_800),
        source: { category: 'Account', confidence: 0.96 },
      },
    ],
  },
]

/** Keyword buckets that stand in for the future TF-IDF + cosine similarity matcher. */
const FAQ_RULES = [
  {
    category: 'Courses',
    keywords: ['course', 'enroll', 'class', 'syllabus', 'learning', 'module', 'learn'],
    answer:
      'You can enroll from the Courses section of your ArchintX dashboard — choose a course and press "Enroll Now". Seats are confirmed by email right away, and you can start the first module immediately.',
  },
  {
    category: 'Certificates',
    keywords: ['certificate', 'certification', 'verify', 'verification', 'credential', 'grade'],
    answer:
      'Each certificate includes a unique verification ID. Share the verification link (or enter the ID on the Certificate Verification page) so employers can confirm the holder name, course, grade, and issue date.',
  },
  {
    category: 'Jobs',
    keywords: ['job', 'placement', 'career', 'hiring', 'recruiter', 'employment', 'portal', 'resume'],
    answer:
      'Completing an ArchintX path unlocks the job portal, where you can create a profile, browse roles, and apply. Placement support and resume reviews are included for verified learners.',
  },
  {
    category: 'Account',
    keywords: ['account', 'password', 'login', 'sign in', 'email', 'reset', 'profile', 'password'],
    answer:
      'For account issues, use "Forgot password?" on the login screen to receive a reset link, and make sure your profile email is current. Reset links expire after 15 minutes.',
  },
]

const FALLBACK = (question) =>
  `Thanks for asking about "${question}". I could not find an exact FAQ match yet, but our team is expanding the knowledge base weekly. Meanwhile, try the Courses, Certificates, Jobs, or Account sections above — or rephrase your question and I will try again.`

/**
 * Stand-in for POST /chat.
 * Returns the assistant reply plus which FAQ category "matched".
 * Replace the body with an api.post() call when Flask is wired up.
 */
export function matchFaqReply(question) {
  const text = question.toLowerCase()
  let best = null
  for (const rule of FAQ_RULES) {
    const score = rule.keywords.reduce((hits, kw) => (text.includes(kw) ? hits + 1 : hits), 0)
    if (score > 0 && (!best || score > best.score)) best = { rule, score }
  }
  if (!best) {
    return { text: FALLBACK(question), source: { category: 'Unmatched', confidence: 0.32 } }
  }
  return {
    text: best.rule.answer,
    source: {
      category: best.rule.category,
      confidence: Math.min(0.98, 0.78 + best.score * 0.07),
    },
  }
}
