// Deep links that open an AI assistant with a prompt already filled in.
// The user still presses send, and nothing is sent from our side.

export type AiProvider = 'claude' | 'chatgpt'

export const aiProviders: Record<AiProvider, { label: string; url: string }> = {
  claude: { label: 'Claude', url: 'https://claude.ai/new' },
  chatgpt: { label: 'ChatGPT', url: 'https://chatgpt.com/' },
}

// Long prompts in a URL get truncated or rejected; keep a margin under typical 8k limits.
export const AI_PROMPT_SAFE_LENGTH = 6000

export function buildAiChatUrl(provider: AiProvider, prompt: string): string {
  return `${aiProviders[provider].url}?q=${encodeURIComponent(prompt.trim())}`
}

// Measured on the encoded prompt, since that is what ends up in the URL.
export const isAiPromptTooLong = (prompt: string) =>
  encodeURIComponent(prompt.trim()).length > AI_PROMPT_SAFE_LENGTH
