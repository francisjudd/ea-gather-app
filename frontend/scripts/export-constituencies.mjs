// Builds the interim constituency JSON from data-source/combined.db and the MP list.
// Run from the repo root or frontend/:  npm run data:constituencies -w frontend
// Output (committed, so deploys don't need the DB): lib/constituencies/generated/
//   index.json            ConstituencySummary[]
//   by-slug/<slug>.json   ConstituencyDetail
// Throwaway once the FastAPI endpoints exist.

import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const outDir = join(root, 'frontend', 'lib', 'constituencies', 'generated')

const slugify = (name) =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const norm = (name) => slugify(name)

// Minimal CSV reader (quotes, embedded commas/newlines). Rows can be ragged; we only use early columns.
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

const csv = parseCsv(readFileSync(join(root, 'data-source', 'MP Contact List.csv'), 'utf8').replace(/^﻿/, ''))
const header = csv[0]
const col = (name) => header.indexOf(name)
const mps = new Map()
for (const r of csv.slice(1)) {
  const constituency = r[col('Constituency')]
  if (!constituency) continue
  mps.set(norm(constituency), {
    name: r[col('FullName')],
    party: r[col('Party')] || null,
    email: r[col('ParliamentEmail')] || null,
  })
}

const db = new DatabaseSync(join(root, 'data-source', 'combined.db'), { readOnly: true })
const nz = (v) => (v === '' || v === undefined ? null : v)

const churches = db.prepare(
  `SELECT id, slug, name, denomination, address, postcode, lat, lng, website, phone, constituency, constituency_code
   FROM churches WHERE constituency IS NOT NULL AND constituency != '' AND constituency NOT LIKE '(%' ORDER BY name`,
).all()
const services = db.prepare(
  `SELECT id, category, name, address, postcode, lat, lng, website, phone, constituency, constituency_code
   FROM services WHERE constituency IS NOT NULL AND constituency != '' AND constituency NOT LIKE '(%' ORDER BY name`,
).all()

// Programmes linked to each church (church_services), de-duplicated by name + category.
const programmesByChurch = new Map()
for (const row of db.prepare(
  `SELECT cs.church_id, s.name, s.category
   FROM church_services cs JOIN services s ON s.id = cs.service_id
   WHERE s.name IS NOT NULL ORDER BY s.name`,
).all()) {
  const list = programmesByChurch.get(row.church_id) ?? []
  if (!list.some((p) => p.name === row.name && p.category === row.category)) {
    list.push({ name: row.name, category: row.category ?? 'Other' })
  }
  programmesByChurch.set(row.church_id, list)
}

const byName = new Map()
const entry = (name, code) => {
  // Key by slug: the same constituency can be spelled with/without accents across tables.
  const slug = slugify(name)
  if (!byName.has(slug)) {
    byName.set(slug, { slug, name, code: nz(code), churches: [], services: [] })
  }
  return byName.get(slug)
}
for (const c of churches) {
  entry(c.constituency, c.constituency_code).churches.push({
    id: c.slug, name: c.name, denomination: nz(c.denomination), address: nz(c.address),
    postcode: nz(c.postcode), lat: c.lat, lng: c.lng, website: nz(c.website), phone: nz(c.phone),
    programmes: programmesByChurch.get(c.id) ?? [],
  })
}
for (const s of services) {
  entry(s.constituency, s.constituency_code).services.push({
    id: String(s.id), category: s.category, name: s.name, address: nz(s.address),
    postcode: nz(s.postcode), lat: s.lat, lng: s.lng, website: nz(s.website), phone: nz(s.phone),
  })
}

const slugs = new Set()
const index = []
rmSync(outDir, { recursive: true, force: true })
mkdirSync(join(outDir, 'by-slug'), { recursive: true })
let withMp = 0
for (const e of [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))) {
  if (slugs.has(e.slug)) throw new Error(`Duplicate slug: ${e.slug}`)
  slugs.add(e.slug)
  const mp = mps.get(norm(e.name)) ?? null
  if (mp) withMp++
  const servicesByCategory = {}
  for (const s of e.services) servicesByCategory[s.category] = (servicesByCategory[s.category] ?? 0) + 1
  const summary = { slug: e.slug, name: e.name, code: e.code, churchCount: e.churches.length, serviceCount: e.services.length }
  index.push(summary)
  writeFileSync(join(outDir, 'by-slug', `${e.slug}.json`), JSON.stringify({ ...summary, mp, churches: e.churches, services: e.services, servicesByCategory }))
}
writeFileSync(join(outDir, 'index.json'), JSON.stringify(index))
console.log(`${index.length} constituencies, ${withMp} matched to an MP, ${churches.length} churches, ${services.length} services`)
