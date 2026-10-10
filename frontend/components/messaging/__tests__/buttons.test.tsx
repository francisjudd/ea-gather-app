import { renderToStaticMarkup } from 'react-dom/server'
import { isValidElement, type ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import AiPromptButton from '../AiPromptButton'
import EmailButton from '../EmailButton'
import GmailButton from '../GmailButton'

describe('EmailButton', () => {
  it('renders a mailto anchor', () => {
    const html = renderToStaticMarkup(
      <EmailButton to="mp@parliament.uk" cc="jo@x.org" subject="Hi there" body={'a\nb'} />,
    )
    expect(html).toContain('<a ')
    expect(html).toContain('href="mailto:mp@parliament.uk?cc=jo@x.org&amp;subject=Hi%20there&amp;body=a%0D%0Ab"')
    expect(html).toContain('class="button button-primary"')
    expect(html).toContain('Open in my email app')
    expect(html).not.toContain('<button')
  })

  it('accepts a custom label and class', () => {
    const html = renderToStaticMarkup(<EmailButton to="a@b.co" label="Send" className="x" />)
    expect(html).toContain('class="x"')
    expect(html).toContain('Send</a>')
  })

  it('renders a disabled button, and no link, when disabled', () => {
    const html = renderToStaticMarkup(<EmailButton to="a@b.co" subject="s" disabled />)
    expect(html).toMatch(/^<button class="button button-primary" type="button" disabled="">/)
    expect(html).not.toContain('href')
    expect(html).not.toContain('mailto')
  })

  it('wires onClick to the anchor', () => {
    const onClick = vi.fn()
    const element = EmailButton({ to: 'a@b.co', onClick }) as ReactElement<{ onClick?: () => void }>
    expect(isValidElement(element)).toBe(true)
    element.props.onClick?.()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not pass onClick to the disabled button', () => {
    const element = EmailButton({ to: 'a@b.co', onClick: vi.fn(), disabled: true }) as ReactElement<{
      onClick?: () => void
    }>
    expect(element.props.onClick).toBeUndefined()
  })
})

describe('GmailButton', () => {
  it('renders a Gmail compose link that opens in a new tab safely', () => {
    const html = renderToStaticMarkup(<GmailButton to="mp@parliament.uk" subject="Hi" />)
    expect(html).toContain('href="https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to=mp@parliament.uk&amp;su=Hi"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('Open in Gmail')
  })

  it('renders a disabled button when disabled', () => {
    const html = renderToStaticMarkup(<GmailButton to="a@b.co" disabled />)
    expect(html).toMatch(/^<button class="button button-secondary" type="button" disabled="">/)
    expect(html).not.toContain('href')
  })

  it('wires onClick to the anchor', () => {
    const onClick = vi.fn()
    const element = GmailButton({ to: 'a@b.co', onClick }) as ReactElement<{ onClick?: () => void }>
    element.props.onClick?.()
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('AiPromptButton', () => {
  it('links to the provider with the encoded prompt, in a new tab', () => {
    const html = renderToStaticMarkup(<AiPromptButton provider="claude" prompt="Write & send 100%" />)
    expect(html).toContain('href="https://claude.ai/new?q=Write%20%26%20send%20100%25"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('class="button button-secondary"')
  })

  it('uses a provider-specific default label, or a custom one', () => {
    expect(renderToStaticMarkup(<AiPromptButton provider="claude" prompt="x" />)).toContain('Draft with Claude')
    expect(renderToStaticMarkup(<AiPromptButton provider="chatgpt" prompt="x" />)).toContain('Draft with ChatGPT')
    expect(renderToStaticMarkup(<AiPromptButton provider="chatgpt" prompt="x" label="Go" />)).toContain('>Go</a>')
  })

  it('links to chatgpt.com', () => {
    expect(renderToStaticMarkup(<AiPromptButton provider="chatgpt" prompt="hi" />)).toContain(
      'href="https://chatgpt.com/?q=hi"',
    )
  })
})
