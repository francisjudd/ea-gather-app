// Mustache rendering shared by emails and AI prompts.
//
// Cheat sheet (https://mustache.github.io/mustache.5.html):
//   {{name}}                   value ('' if missing); dotted paths work: {{mp.first_name}}
//   {{#thing}}…{{/thing}}      shown only if thing is set; loops if thing is a list
//   {{^thing}}…{{/thing}}      shown only if thing is missing/empty
//   {{> partial}}              reuse a named snippet
// A tag alone on its line leaves no blank line behind, so optional lines vanish cleanly.

import Mustache from 'mustache'

export type TemplateView = Record<string, unknown>
export type TemplatePartials = Record<string, string>

// Plain text, not HTML: don't turn "&" in URLs into "&amp;".
const plainText = (value: string) => value

export function renderTemplate(
  template: string,
  view: TemplateView,
  partials?: TemplatePartials,
): string {
  return Mustache.render(template, view, partials, { escape: plainText })
}

export type TaggedChunk<Kind extends string> = { kind: Kind; text: string }

// Splits a template into tagged chunks. Each chunk starts with a line like
// "@@ data" and is rendered on its own, so empty chunks (e.g. no personal
// note) disappear.
export function renderTaggedTemplate<Kind extends string>(
  source: string,
  view: TemplateView,
  partials?: TemplatePartials,
): TaggedChunk<Kind>[] {
  const parts = source.split(/^@@ (\w+)[ \t]*\n/m)
  const chunks: TaggedChunk<Kind>[] = []
  for (let i = 1; i < parts.length; i += 2) {
    const text = renderTemplate(parts[i + 1], view, partials)
    if (text.trim()) chunks.push({ kind: parts[i] as Kind, text })
  }
  return chunks
}
