import axios from 'axios'

// Single Axios instance for the whole app. Base URL comes from the Vite env
// var so it is never hardcoded. Every request that has a stored token attaches
// it as a Bearer header.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
