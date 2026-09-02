import { createContext } from 'react'

// The context object lives in its own file so the provider module can export
// only components (keeps React Fast Refresh happy).
export const AuthContext = createContext(null)

export const TOKEN_KEY = 'orvx_token'
export const USER_KEY = 'orvx_user'
