import type { NextConfig } from 'next'

// On Vercel, vercel.json routes /openapi/* to the FastAPI service on the same
// domain and strips the /openapi prefix before forwarding. In local development
// we mirror that: proxy /openapi/* to uvicorn with the prefix stripped, so the
// frontend can always fetch same-origin `/openapi/...` URLs.
const devBackendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

const nextConfig: NextConfig = {
  // The old "Your area" page was retired in favour of the constituencies pages.
  async redirects() {
    return [{ source: '/your-area', destination: '/constituencies', permanent: false }]
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return []
    return [
      { source: '/openapi', destination: `${devBackendUrl}/` },
      { source: '/openapi/:path*', destination: `${devBackendUrl}/:path*` },
    ]
  },
}

export default nextConfig
