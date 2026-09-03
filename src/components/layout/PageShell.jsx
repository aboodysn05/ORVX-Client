import { NavBar } from './NavBar'
import { SiteFooter } from './SiteFooter'
import '../../styles/page.css'

// Shared frame for the secondary public pages (Drills, Leagues, About):
// the dark backdrop + grid + glows, the nav, and the footer.
export function PageShell({ children }) {
  return (
    <div className="page">
      <div className="page__grid" />
      <div className="page__glow-a" />
      <div className="page__glow-b" />
      <div className="page__dots" />
      <NavBar />
      <main className="page__main">{children}</main>
      <SiteFooter />
    </div>
  )
}
