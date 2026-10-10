import { describe, expect, it } from 'vitest'
import { renderTaggedTemplate, renderTemplate } from '../template'

describe('renderTemplate', () => {
  it('resolves dotted paths', () => {
    expect(renderTemplate('Hi {{mp.first_name}}', { mp: { first_name: 'Sam' } })).toBe('Hi Sam')
  })

  it('renders missing and null values as empty', () => {
    expect(renderTemplate('[{{a}}][{{b.c}}][{{d}}]', { d: null })).toBe('[][][]')
  })

  it('renders 0 but not false', () => {
    expect(renderTemplate('[{{n}}][{{f}}]', { n: 0, f: false })).toBe('[0][false]')
  })

  describe('sections', () => {
    it('shows a section only for truthy values', () => {
      const t = '{{#x}}yes{{/x}}'
      expect(renderTemplate(t, { x: 'a' })).toBe('yes')
      expect(renderTemplate(t, { x: '' })).toBe('')
      expect(renderTemplate(t, { x: 0 })).toBe('')
      expect(renderTemplate(t, { x: null })).toBe('')
      expect(renderTemplate(t, {})).toBe('')
    })

    it('loops over lists and ignores empty lists', () => {
      const t = '{{#xs}}<{{.}}>{{/xs}}'
      expect(renderTemplate(t, { xs: ['a', 'b'] })).toBe('<a><b>')
      expect(renderTemplate(t, { xs: [] })).toBe('')
    })

    it('inverted sections show for missing, empty and false values', () => {
      const t = '{{^x}}none{{/x}}'
      expect(renderTemplate(t, {})).toBe('none')
      expect(renderTemplate(t, { x: [] })).toBe('none')
      expect(renderTemplate(t, { x: false })).toBe('none')
      expect(renderTemplate(t, { x: 'a' })).toBe('')
    })
  })

  it('leaves no blank line for standalone tags', () => {
    const t = 'one\n{{#x}}\ntwo\n{{/x}}\nthree\n'
    expect(renderTemplate(t, { x: true })).toBe('one\ntwo\nthree\n')
    expect(renderTemplate(t, { x: false })).toBe('one\nthree\n')
  })

  it('does not HTML-escape', () => {
    expect(renderTemplate('{{u}}', { u: 'https://x.org/?a=1&b=2' })).toBe('https://x.org/?a=1&b=2')
    expect(renderTemplate('{{t}}', { t: `<b> "quoted" & 'single'` })).toBe(`<b> "quoted" & 'single'`)
  })

  it('outputs user text literally and never re-interprets it', () => {
    const view = { x: 'secret', note: '{{x}} {{{x}}} <script>alert(1)</script> {{#x}}hi{{/x}}' }
    expect(renderTemplate('{{note}}', view)).toBe(view.note)
    expect(renderTemplate('{{{note}}}', view)).toBe(view.note)
  })

  it('supports partials', () => {
    expect(renderTemplate('a {{> p}} b', { n: 1 }, { p: '[{{n}}]' })).toBe('a [1] b')
  })
})

describe('renderTaggedTemplate', () => {
  it('splits on @@ markers and renders each chunk', () => {
    const src = '@@ template\nDear {{n}},\n\n@@ data\nLine {{n}}\n'
    expect(renderTaggedTemplate(src, { n: 'Sam' })).toEqual([
      { kind: 'template', text: 'Dear Sam,\n\n' },
      { kind: 'data', text: 'Line Sam\n' },
    ])
  })

  it('drops chunks that render empty or whitespace-only', () => {
    const src = '@@ a\nkeep\n@@ b\n{{#x}}\nnope\n{{/x}}\n@@ c\n   \n\n@@ d\nend\n'
    expect(renderTaggedTemplate(src, {}).map((c) => c.kind)).toEqual(['a', 'd'])
  })

  it('returns nothing when there are no markers', () => {
    expect(renderTaggedTemplate('just text {{x}}', { x: 1 })).toEqual([])
    expect(renderTaggedTemplate('', {})).toEqual([])
  })

  it('ignores text before the first marker', () => {
    const chunks = renderTaggedTemplate('preamble\n@@ a\nbody\n', {})
    expect(chunks).toEqual([{ kind: 'a', text: 'body\n' }])
  })

  it('treats an unknown kind as just a label', () => {
    expect(renderTaggedTemplate('@@ whatever\nx\n', {})).toEqual([{ kind: 'whatever', text: 'x\n' }])
  })

  it('tolerates trailing spaces after the marker word', () => {
    expect(renderTaggedTemplate('@@ a  \t\nx\n', {})).toEqual([{ kind: 'a', text: 'x\n' }])
  })

  it('only treats @@ at the start of a line as a marker', () => {
    expect(renderTaggedTemplate('@@ a\nemail me @@ b\nmore\n', {})).toEqual([
      { kind: 'a', text: 'email me @@ b\nmore\n' },
    ])
  })

  it('does not re-interpret user text that looks like a marker or tag', () => {
    const note = '{{x}}\n@@ data\nfake'
    const chunks = renderTaggedTemplate('@@ personal\n{{note}}\n', { note, x: 'no' })
    expect(chunks).toEqual([{ kind: 'personal', text: `${note}\n` }])
  })
})
