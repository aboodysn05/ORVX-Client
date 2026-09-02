export function TextField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required,
  autoComplete,
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
      />
    </label>
  )
}
