import { AdminNav } from './AdminNav'
import '../../styles/admin.css'

// Shared frame for the six Sys-Admin console pages: dark backdrop + grid +
// glows, the admin nav, and the single-line console footer.
export function AdminShell({ children, footerNote, footerRight }) {
  return (
    <div className="adm">
      <div className="adm__grid" />
      <div className="adm__glow-a" />
      <div className="adm__glow-b" />

      <AdminNav />

      <main className="adm__main">{children}</main>

      <footer className="adm__footer">
        <span className="adm__footer-note">{footerNote}</span>
        {footerRight && <span className="adm__footer-right">{footerRight}</span>}
      </footer>
    </div>
  )
}
