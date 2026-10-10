export const flowSteps = [
  { slug: 'intro', label: 'Intro', path: '/contact-mp' },
  { slug: 'mp-lookup', label: 'MP lookup', path: '/contact-mp/mp-lookup' },
  { slug: 'church-details', label: 'Church details', path: '/contact-mp/church-details' },
  { slug: 'activities', label: 'Activities', path: '/contact-mp/activities' },
  { slug: 'message', label: 'Your message', path: '/contact-mp/message' },
  { slug: 'review-send', label: 'Review & send', path: '/contact-mp/review-send' },
  { slug: 'confirmation', label: 'Confirmation', path: '/contact-mp/confirmation' },
] as const

export type StepSlug = (typeof flowSteps)[number]['slug']
