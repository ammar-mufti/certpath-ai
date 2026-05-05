import { CERTIFICATIONS } from '../data/certifications'

export const toDomainSlug = (domain: string): string =>
  domain.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

export const fromDomainSlug = (slug: string): string => {
  for (const cert of CERTIFICATIONS) {
    for (const d of cert.domains) {
      if (toDomainSlug(d.name) === slug) return d.name
    }
  }
  return slug
}

export const toTopicSlug = (topic: string): string =>
  topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const DOMAIN_ICONS: Record<string, string> = {
  'CX Strategy': 'lightbulb',
  'Customer-Centric Culture': 'groups',
  'Voice of Customer': 'record_voice_over',
  'Experience Design': 'design_services',
  'Metrics & Measurement': 'analytics',
  'Organizational Adoption': 'corporate_fare',
  'People': 'groups',
  'Process': 'account_tree',
  'Business Environment': 'business',
  'Cloud Concepts': 'cloud',
  'Security and Compliance': 'security',
  'Cloud Technology and Services': 'dns',
  'Billing, Pricing, and Support': 'payments',
  'Billing Pricing and Support': 'payments',
  'Scrum Theory and Principles': 'psychology',
  'Scrum Framework': 'loop',
  'Scrum Master Role': 'manage_accounts',
  'Scaled Scrum': 'hub',
  'Key Concepts of ITIL': 'key',
  'Four Dimensions': 'grid_view',
  'ITIL Service Value System': 'diamond',
  'ITIL Practices': 'engineering',
}

export const getDomainIcon = (domainName: string): string =>
  DOMAIN_ICONS[domainName] ?? 'book'
