const LINKS = ['Home', 'Drills', 'Leagues', 'About']

// Shared site footer, used on every public page.
//
// Styled entirely with Tailwind CSS utility classes (the project's UI
// framework) rather than a bespoke stylesheet: the brand colours and typeface
// come from the @theme tokens registered in index.css, and the responsive
// behaviour is expressed with Tailwind's own flex/wrap utilities, so the
// footer reflows from a single column on a phone to a spread row on desktop
// without any custom media query.
const linkClass =
  'text-orvx-text no-underline transition-colors hover:text-orvx-pink ' +
  'focus-visible:outline-2 focus-visible:outline-orvx-indigo focus-visible:outline-offset-2'

export function SiteFooter() {
  return (
    <footer className="relative mt-auto shrink-0 border-t border-orvx-indigo/20 bg-orvx-ink/70 px-[var(--ovrx-gutter)] pt-11 pb-9 font-orvx">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 46 46" fill="none">
            <path d="M6 4 L18 23 L6 42" stroke="#FF2E63" strokeWidth="6" strokeLinecap="square" />
            <path d="M23 4 L35 23 L23 42" stroke="#FF2E63" strokeWidth="6" strokeLinecap="square" opacity="0.5" />
          </svg>
          <span className="text-[17px] font-black uppercase tracking-[0.16em] text-white">OVRX</span>
          <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.2em] text-orvx-muted">
            Real Sweat. Real Stats.
          </span>
        </div>

        <div className="flex flex-wrap gap-6 text-[12px] font-bold uppercase tracking-[0.14em]">
          {LINKS.map((label) => (
            <a key={label} href="#" className={linkClass}>
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-orvx-indigo/15 pt-5 text-[11.5px] text-orvx-muted">
        <span>© 2026 OVRX. All rights reserved.</span>
        <span className="flex flex-wrap gap-5">
          <a href="#" className={linkClass}>Terms</a>
          <a href="#" className={linkClass}>Privacy</a>
        </span>
      </div>
    </footer>
  )
}
