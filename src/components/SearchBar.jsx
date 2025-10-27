export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      className="input"
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}
