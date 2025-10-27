const regions = ['all', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania']

export default function Filters({ region, setRegion, sortBy, setSortBy }) {
  return (
    <div className="filters">
      <select className="input" value={region} onChange={e => setRegion(e.target.value)}>
        {regions.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value)}>
        <option value="name">Sort: Name</option>
        <option value="population">Sort: Population</option>
        <option value="area">Sort: Area</option>
      </select>
    </div>
  )
}
