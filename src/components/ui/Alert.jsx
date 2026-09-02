export function Alert({ children }) {
  if (!children) {
    return null
  }
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p>
  )
}
