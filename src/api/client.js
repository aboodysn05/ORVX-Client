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

export default client
