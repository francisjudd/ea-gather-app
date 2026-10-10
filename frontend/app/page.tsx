export default function Home() {
  return (
    <main className="page-shell">
      <section className="welcome-card" aria-labelledby="welcome-heading">
        <span className="eyebrow">EA Gathering App</span>
        <h1 id="welcome-heading">Your gathering starts here.</h1>
        <p>
          The Next.js frontend is ready. Backend contract types will be generated
          from the OpenAPI specification when it is available.
        </p>
        <div className="status-row">
          <span className="status-dot" aria-hidden="true" />
          <span>Frontend initialized</span>
          <span className="divider" aria-hidden="true">·</span>
          <span>OpenAPI type generation configured</span>
        </div>
      </section>
    </main>
  )
}