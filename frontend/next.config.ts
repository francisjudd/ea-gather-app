import type { NextConfig } from 'next'

// On Vercel, vercel.json routes /openapi/* to the FastAPI service on the same
// domain, forwarding the full /openapi path. In local development we mirror
// that: proxy /openapi/* to uvicorn with the prefix preserved, so the frontend
// can always fetch same-origin `/openapi/...` URLs.
const devBackendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return []
    return [
      { source: '/openapi', destination: `${devBackendUrl}/openapi` },
      { source: '/openapi/:path*', destination: `${devBackendUrl}/openapi/:path*` },
    ]
  },
}

export default nextConfig
