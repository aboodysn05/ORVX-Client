import axios from 'axios'

// Single Axios instance for the whole app. Base URL comes from the Vite env
// var so it is never hardcoded. Every request that has a stored token attaches
// it as a Bearer header.
const baseURL = import.meta.env.VITE_API_BASE_URL

// Vite inlines this value at BUILD time, not at runtime — so a deployment
// built without VITE_API_BASE_URL set produces a bundle with no API address
// at all, and every call silently resolves against the site's own origin
// (404s that look like "the backend is down"). Fail loudly instead.
if (!baseURL) {
  console.error(
    'VITE_API_BASE_URL is not set. This build cannot reach the API.\n' +
      'Set it on the hosting provider (e.g. https://your-api.up.railway.app/api) ' +
      'and REBUILD — changing the variable without a rebuild has no effect, ' +
      'because Vite bakes it into the bundle.',
  )
}

const client = axios.create({
  baseURL,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('orvx_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// The real backend's centralized error handler responds with
// { error: { message, code } } (see backend/src/middleware/error.js), but
// every form in this app was written against authMock.js's flatter
// { message } shape. Rather than touch every err.response.data.message read
// site, normalize here so that field always exists regardless of which
// shape actually came back.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data
    if (data && data.message === undefined && data.error?.message) {
      data.message = data.error.message
    }
    return Promise.reject(err)
  },
)

export default client
