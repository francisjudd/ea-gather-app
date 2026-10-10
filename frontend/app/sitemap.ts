import type { MetadataRoute } from 'next'
import { constituencies } from '@/lib/constituencies/source'
import { sitePages, siteUrl } from '@/lib/site'
import { getChurchLinks } from './churches/church-data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [constituencyList, churchList] = await Promise.all([constituencies.list(), getChurchLinks()])

  return [
    ...sitePages.map(({ path }) => ({ url: `${siteUrl}${path}` })),
    ...constituencyList.map(({ slug }) => ({ url: `${siteUrl}/constituencies/${slug}` })),
    ...churchList.map(({ id }) => ({ url: `${siteUrl}/churches/${encodeURIComponent(id)}` })),
  ]
}
