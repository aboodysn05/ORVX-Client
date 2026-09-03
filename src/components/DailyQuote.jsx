import { useEffect, useState } from 'react'
import axios from 'axios'

// Replaces the static hero headline with ZenQuotes' "quote of the day".
//
// Speed / reliability:
//   - The last quote we fetched is cached in localStorage. On any later visit
//     it shows INSTANTLY (no network) while a fresh one is fetched in the
//     background — so after the first success the hero is never slow again.
//   - A cold visit with no cache shows the static headline immediately, then
//     the quote fades in once fetched.
//   - Sources are raced with Promise.any and a short timeout, so one slow or
//     blocked proxy can't hold things up. If they all fail, whatever is on
//     screen (cached quote, or the static headline) just stays.
//
// Sources, raced:
//   1. `/zenquotes/today` — Vite dev-server proxy (same-origin, no CORS).
//   2. keyless public proxy wrappers, for a built / deployed site.
const ZEN_QUOTES_URL = 'https://zenquotes.io/api/today'

const SOURCES = [
  '/zenquotes/today',
  `https://api.allorigins.win/raw?url=${encodeURIComponent(ZEN_QUOTES_URL)}`,
  `https://api.codetabs.com/v1/proxy?quest=${ZEN_QUOTES_URL}`,
]

const CACHE_KEY = 'ovrx_daily_quote'
const REQUEST_TIMEOUT = 2500

function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

// Returns { quote, fresh } — quote is the last one we ever cached (shown
// immediately), fresh tells us whether it is already today's.
function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (!cached?.quote?.text) {
      return { quote: null, fresh: false }
    }
    return { quote: cached.quote, fresh: cached.date === todayStamp() }
  } catch {
    return { quote: null, fresh: false }
  }
}

function writeCache(quote) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayStamp(), quote }))
  } catch {
    // storage unavailable (private mode etc.) — not fatal
  }
}

// Normalises the different proxy response shapes to ZenQuotes' first item.
function readQuoteItem(data) {
  let raw = typeof data === 'string' ? JSON.parse(data) : data
  if (raw && typeof raw.contents === 'string') {
    raw = JSON.parse(raw.contents)
  }
  return Array.isArray(raw) ? raw[0] : null
}

async function fetchFromSource(url) {
  const { data } = await axios.get(url, { timeout: REQUEST_TIMEOUT })
  const item = readQuoteItem(data)
  if (!item?.q || item.a === 'zenquotes.io') {
    throw new Error('No usable quote in response')
  }
  return { text: item.q, author: item.a }
}

async function fetchDailyQuote() {
  try {
    return await Promise.any(SOURCES.map(fetchFromSource))
  } catch {
    return null
  }
}

export function DailyQuote() {
  // seed from cache so a repeat visit paints the quote with no fetch
  const [quote, setQuote] = useState(() => readCache().quote)

  useEffect(() => {
    if (readCache().fresh) {
      return undefined
    }
    let active = true
    fetchDailyQuote().then((result) => {
      if (active && result) {
        setQuote(result)
        writeCache(result)
      }
    })
    return () => {
      active = false
    }
  }, [])

  if (!quote) {
    return (
      <h1 className="hero__title">
        Turn Real Sweat<br />
        <span className="hero__title-accent">Into Real Stats.</span>
      </h1>
    )
  }

  return (
    <div className="hero__quote">
      <h1 className="hero__title hero__title--quote">&ldquo;{quote.text}&rdquo;</h1>
      <p className="hero__quote-author">&mdash; {quote.author}</p>
    </div>
  )
}
