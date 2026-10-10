export function SpinnerIcon() {
  return <span className="loading-spinner" aria-hidden="true" />
}

export default function LoadingSpinner({ label }: { label: string }) {
  return (
    <span className="loading-indicator" role="status" aria-live="polite">
      <SpinnerIcon />
      <span>{label}</span>
    </span>
  )
}
