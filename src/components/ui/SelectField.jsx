export function SelectField({ label, name, value, onChange, options, required }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
