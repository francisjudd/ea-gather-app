import { aiProviders, buildAiChatUrl, type AiProvider } from '@/lib/messaging'

export default function AiPromptButton({
  provider,
  prompt,
  label,
  className = 'button button-secondary',
}: {
  provider: AiProvider
  prompt: string
  label?: string
  className?: string
}) {
  return (
    <a className={className} href={buildAiChatUrl(provider, prompt)} target="_blank" rel="noopener noreferrer">
      {label ?? `Draft with ${aiProviders[provider].label}`}
    </a>
  )
}
