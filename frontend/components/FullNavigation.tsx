import Link from 'next/link'
import SiteNav from './SiteNav'
import BrandLockup from './BrandLockup'

export default function FullNav() {
    return (
        <header className="site-header">
            <Link className="brand-lockup" href="/" aria-label="Evangelical Alliance home">
                <BrandLockup />
            </Link>
            <div className="site-actions">
                <SiteNav />
            </div>
        </header>
    )
}
