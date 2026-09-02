export function Button({ children, type = 'button', disabled, ...props }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  )
}
