import type { NextConfig } from 'next'

// On Vercel, vercel.json routes /openapi/* to the FastAPI service on the same
// domain. In local development, proxy it to uvicorn so the frontend can always
// fetch same-origin `/openapi/...` URLs.
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
