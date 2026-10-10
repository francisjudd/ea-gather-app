import { describe, expect, it } from 'vitest'
import { AI_PROMPT_SAFE_LENGTH, aiProviders, buildAiChatUrl, isAiPromptTooLong } from '../aiLinks'

describe('buildAiChatUrl', () => {
  it('builds claude.ai and chatgpt.com links', () => {
    expect(buildAiChatUrl('claude', 'Hello')).toBe('https://claude.ai/new?q=Hello')
    expect(buildAiChatUrl('chatgpt', 'Hello')).toBe('https://chatgpt.com/?q=Hello')
  })

  it('trims and encodes the prompt, including newlines and reserved characters', () => {
    const prompt = '  Draft a letter & keep it 100% short?\n\nThanks 🙏 #mp  '
    const url = buildAiChatUrl('claude', prompt)
    expect(url).toBe(
      'https://claude.ai/new?q=Draft%20a%20letter%20%26%20keep%20it%20100%25%20short%3F%0A%0AThanks%20%F0%9F%99%8F%20%23mp',
    )
    expect(decodeURIComponent(url.split('?q=')[1])).toBe(prompt.trim())
  })

  it('gives an empty q for an empty prompt', () => {
    expect(buildAiChatUrl('claude', '   ')).toBe(`${aiProviders.claude.url}?q=`)
  })
})

describe('isAiPromptTooLong', () => {
  it('flips just past the limit', () => {
    expect(isAiPromptTooLong('x'.repeat(AI_PROMPT_SAFE_LENGTH))).toBe(false)
    expect(isAiPromptTooLong('x'.repeat(AI_PROMPT_SAFE_LENGTH + 1))).toBe(true)
  })

  it('measures the encoded prompt, which is what the URL carries', () => {
    const spaced = (n: number) => `a${' '.repeat(n)}a` // 2 + 3n characters once encoded
    expect(isAiPromptTooLong(spaced(1999))).toBe(false)
    expect(isAiPromptTooLong(spaced(2000))).toBe(true)
    expect(isAiPromptTooLong(`  ${spaced(1999)}  `)).toBe(false) // trimmed, like the URL builder
  })
})
