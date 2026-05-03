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
