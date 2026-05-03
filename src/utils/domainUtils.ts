// CCXP slug overrides — other cert domains use the computed fallback
const DOMAIN_SLUGS: Record<string, string> = {
  'CX Strategy': 'cx-strategy',
  'Customer-Centric Culture': 'customer-centric-culture',
  'Voice of Customer': 'voice-of-customer',
  'Experience Design': 'experience-design',
  'Metrics & Measurement': 'metrics-measurement',
  'Organizational Adoption': 'organizational-adoption',
}

const DOMAIN_FROM_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(DOMAIN_SLUGS).map(([k, v]) => [v, k])
)

export const toDomainSlug = (domain: string): string =>
  DOMAIN_SLUGS[domain] ?? domain.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

export const fromDomainSlug = (slug: string): string =>
  DOMAIN_FROM_SLUG[slug] ?? slug

export const toTopicSlug = (topic: string): string =>
  topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
