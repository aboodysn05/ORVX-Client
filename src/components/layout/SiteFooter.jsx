import '../../styles/footer.css'

const LINKS = ['Home', 'Drills', 'Leagues', 'About']

// Shared site footer, used on every public page.
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <svg width="22" height="22" viewBox="0 0 46 46" fill="none">
            <path d="M6 4 L18 23 L6 42" stroke="#FF2E63" strokeWidth="6" strokeLinecap="square" />
            <path d="M23 4 L35 23 L23 42" stroke="#FF2E63" strokeWidth="6" strokeLinecap="square" opacity="0.5" />
          </svg>
          <span className="site-footer__brand-name">OVRX</span>
          <span className="site-footer__brand-tag">Real Sweat. Real Stats.</span>
        </div>
        <div className="site-footer__links">
          {LINKS.map((label) => (
            <a key={label} href="#">
              {label}
            </a>
          ))}
        </div>
      </div>
      <div className="site-footer__legal">
        <span>© 2026 OVRX. All rights reserved.</span>
        <span className="site-footer__legal-links">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
        </span>
      </div>
    </footer>
  )
}
