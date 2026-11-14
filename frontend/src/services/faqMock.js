/**
 * Sample FAQ knowledge-base entries — the stand-in until the Flask +
 * PostgreSQL backend exposes GET/POST/PUT/DELETE /faqs. UI components
 * never import this file directly; they go through services/faqService.js
 * so the swap to real APIs stays a one-file change.
 */

export const FAQ_CATEGORIES = ['Courses', 'Certificates', 'Jobs', 'Account']

export const FAQ_STATUS_OPTIONS = [
  { value: 'all', label: 'Status: All' },
  { value: 'active', label: '● Active' },
  { value: 'inactive', label: '○ Inactive' },
]

export const FAQ_SORT_OPTIONS = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'alpha', label: 'Alphabetical' },
]

/**
 * KPI tile definitions. `value` is computed from the live FAQ list at
 * runtime (so add/delete updates the cards); everything else is static
 * presentation config — icon, colours, sparkline series and trend.
 */
export const FAQ_KPIS = [
  {
    id: 'total',
    label: 'Total FAQs',
    icon: 'message',
    chip: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    line: '#a855f7',
    delta: '↑ 5%',
    series: [18, 21, 20, 24, 27],
  },
  {
    id: 'Courses',
    label: 'Courses',
    icon: 'graduation',
    chip: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    line: '#10b981',
    delta: '↑ 2%',
    series: [4, 5, 5, 6, 7],
  },
  {
    id: 'Certificates',
    label: 'Certificates',
    icon: 'award',
    chip: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    line: '#f59e0b',
    delta: '↑ 1%',
    series: [4, 4, 5, 5, 6],
  },
  {
    id: 'Jobs',
    label: 'Jobs',
    icon: 'briefcase',
    chip: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    line: '#38bdf8',
    delta: '↑ 3%',
    series: [3, 4, 4, 5, 6],
  },
  {
    id: 'Account',
    label: 'Account',
    icon: 'user',
    chip: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    line: '#f43f5e',
    delta: '↑ 2%',
    series: [3, 4, 4, 5, 6],
  },
]

export const sampleFaqs = [
  {
    id: 'faq-1',
    question: 'How can I enroll in a course?',
    answer: 'Visit the courses page and select your program to get started right away.',
    category: 'Courses',
    status: 'active',
    updatedAt: '2026-10-31',
  },
  {
    id: 'faq-2',
    question: 'How do I download my certificate?',
    answer: 'Go to your account section, select Certificates, and click download.',
    category: 'Certificates',
    status: 'active',
    updatedAt: '2026-10-30',
  },
  {
    id: 'faq-3',
    question: 'Is there a job opening?',
    answer: 'Visit our careers page or verify open opportunities with partner recruiters.',
    category: 'Jobs',
    status: 'active',
    updatedAt: '2026-10-29',
  },
  {
    id: 'faq-4',
    question: 'How do I reset my password?',
    answer: 'Click on "Forgot Password" on the login screen to receive an email link.',
    category: 'Account',
    status: 'active',
    updatedAt: '2026-10-28',
  },
  {
    id: 'faq-5',
    question: 'What are the benefits of ArchintX courses?',
    answer: 'ArchintX courses offer recognized industry certificates and real projects.',
    category: 'Courses',
    status: 'active',
    updatedAt: '2026-10-27',
  },
  {
    id: 'faq-6',
    question: 'Can I switch courses after enrolling?',
    answer: 'Yes — you may switch once within 7 days of enrolling, straight from your dashboard.',
    category: 'Courses',
    status: 'active',
    updatedAt: '2026-10-26',
  },
  {
    id: 'faq-7',
    question: 'How long does a course take to complete?',
    answer: 'Most courses run 6–12 weeks at a comfortable pace of about 5 hours per week.',
    category: 'Courses',
    status: 'active',
    updatedAt: '2026-10-25',
  },
  {
    id: 'faq-8',
    question: 'Are ArchintX certificates accredited?',
    answer: 'Every certificate is industry-recognized and publicly verifiable through a shareable link.',
    category: 'Certificates',
    status: 'active',
    updatedAt: '2026-10-24',
  },
  {
    id: 'faq-9',
    question: 'How long does it take to receive my certificate?',
    answer: 'Certificates are issued within 24 hours of completing all required assessments.',
    category: 'Certificates',
    status: 'active',
    updatedAt: '2026-10-23',
  },
  {
    id: 'faq-10',
    question: 'Can I share my certificate on LinkedIn?',
    answer: 'Yes — open the certificate and use the Share button to post it directly to your profile.',
    category: 'Certificates',
    status: 'active',
    updatedAt: '2026-10-22',
  },
  {
    id: 'faq-11',
    question: 'Does ArchintX help with job placement?',
    answer: 'Yes, our career team reviews your resume and shares it with hiring partners.',
    category: 'Jobs',
    status: 'active',
    updatedAt: '2026-10-21',
  },
  {
    id: 'faq-12',
    question: 'What roles do ArchintX graduates land?',
    answer: 'Graduates commonly move into junior developer, data analyst and QA engineer roles.',
    category: 'Jobs',
    status: 'active',
    updatedAt: '2026-10-20',
  },
  {
    id: 'faq-13',
    question: 'How do I apply for a listed job?',
    answer: 'Open the listing and click Apply — your profile is attached automatically.',
    category: 'Jobs',
    status: 'active',
    updatedAt: '2026-10-19',
  },
  {
    id: 'faq-14',
    question: 'How do I change my registered email?',
    answer: 'Update it from Account Settings; we send a confirmation link to the new address.',
    category: 'Account',
    status: 'active',
    updatedAt: '2026-10-18',
  },
  {
    id: 'faq-15',
    question: 'How do I delete my account?',
    answer: 'Contact support and we will remove your account and data within 5 working days.',
    category: 'Account',
    status: 'active',
    updatedAt: '2026-10-17',
  },
  {
    id: 'faq-16',
    question: 'Why did I not receive the verification email?',
    answer: 'Check your spam folder, then retry from the login screen after five minutes.',
    category: 'Account',
    status: 'active',
    updatedAt: '2026-10-16',
  },
  {
    id: 'faq-17',
    question: 'Do I get lifetime access to course content?',
    answer: 'Yes — enrolled students keep access to their course and every future update.',
    category: 'Courses',
    status: 'active',
    updatedAt: '2026-10-15',
  },
  {
    id: 'faq-18',
    question: 'Are the courses self-paced?',
    answer: 'All material is on-demand, with optional live mentor sessions each week.',
    category: 'Courses',
    status: 'active',
    updatedAt: '2026-10-14',
  },
  {
    id: 'faq-19',
    question: 'What happens if I fail an assessment?',
    answer: 'You can retake any assessment twice at no additional cost.',
    category: 'Certificates',
    status: 'active',
    updatedAt: '2026-10-13',
  },
  {
    id: 'faq-20',
    question: 'Are the job listings verified?',
    answer: 'Every listing is checked by our team before it appears on the board.',
    category: 'Jobs',
    status: 'active',
    updatedAt: '2026-10-12',
  },
  {
    id: 'faq-21',
    question: 'Can I enable two-factor authentication?',
    answer: 'Yes — turn it on in Account Settings under the Security tab.',
    category: 'Account',
    status: 'active',
    updatedAt: '2026-10-11',
  },
  {
    id: 'faq-22',
    question: 'Do certificates expire?',
    answer: 'No — once earned, an ArchintX certificate never expires.',
    category: 'Certificates',
    status: 'active',
    updatedAt: '2026-10-10',
  },
  {
    id: 'faq-23',
    question: 'How do I update my profile picture?',
    answer: 'Click your avatar in the header and choose Change Photo.',
    category: 'Account',
    status: 'inactive',
    updatedAt: '2026-10-09',
  },
  {
    id: 'faq-24',
    question: 'Is there a discount for annual plans?',
    answer: 'Seasonal discounts are announced on the pricing page and by email.',
    category: 'Courses',
    status: 'inactive',
    updatedAt: '2026-10-08',
  },
]
