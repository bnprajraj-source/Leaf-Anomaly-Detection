import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import DISEASES from '../data/diseases'
import { DISEASE_IMAGES } from '../assets'

const SEVERITY_COLORS = {
  'None': 'bg-leaf-600/20 text-leaf-400 border-leaf-600/30',
  'Moderate': 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  'Moderate to Severe': 'bg-orange-600/20 text-orange-400 border-orange-600/30',
  'Severe': 'bg-red-600/20 text-red-400 border-red-600/30',
}

const CATEGORY_COLORS = {
  'Healthy': 'bg-leaf-600/20 text-leaf-400 border-leaf-600/30',
  'Fungal': 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  'Bacterial': 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  'Fungal / Bacterial': 'bg-amber-600/20 text-amber-400 border-amber-600/30',
}

const SEVERITY_FILTERS = ['All', 'Healthy', 'Moderate', 'Severe']

function DiseaseCard({ disease, onSelect, isSelected }) {
  const image = DISEASE_IMAGES[disease.name] || DISEASE_IMAGES['Healthy']
  const severityClass = SEVERITY_COLORS[disease.severity] || SEVERITY_COLORS['Moderate']
  const categoryClass = CATEGORY_COLORS[disease.category] || CATEGORY_COLORS['Fungal']

  return (
    <button
      onClick={() => onSelect(disease.id)}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] text-left ${
        isSelected
          ? 'border-leaf-500/60 ring-2 ring-leaf-500/20 shadow-lg shadow-leaf-900/20'
          : 'border-leaf-800/30 hover:border-leaf-600/50 hover:shadow-lg hover:shadow-leaf-900/10'
      }`}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={disease.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{disease.icon}</span>
          <h3 className="text-white font-semibold">{disease.name}</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${categoryClass}`}>{disease.category}</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${severityClass}`}>{disease.severity}</span>
        </div>
      </div>
      {isSelected && (
        <div className="absolute top-3 right-3">
          <span className="bg-leaf-600 text-white text-xs font-mono px-2 py-1 rounded-lg shadow-lg">Selected</span>
        </div>
      )}
    </button>
  )
}

function DiseaseDetail({ disease }) {
  const image = DISEASE_IMAGES[disease.name] || DISEASE_IMAGES['Healthy']
  const severityClass = SEVERITY_COLORS[disease.severity] || SEVERITY_COLORS['Moderate']

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Hero image */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="aspect-[21/9]">
          <img src={image} alt={disease.name} className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{disease.icon}</span>
            <h2 className="text-3xl font-display font-bold text-white drop-shadow-lg">{disease.name}</h2>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs font-mono px-3 py-1 rounded-full border backdrop-blur-sm ${severityClass}`}>{disease.severity}</span>
            <span className="text-xs font-mono px-3 py-1 rounded-full border bg-forest-dark/60 text-gray-300 border-leaf-900/40 backdrop-blur-sm">{disease.category}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="glass-card">
        <p className="text-gray-300 leading-relaxed">{disease.description}</p>
      </div>

      {/* Symptoms & Causes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailSection title="Symptoms" icon="🔍" dotColor="bg-amber-400">
          {disease.symptoms.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
              {s}
            </li>
          ))}
        </DetailSection>

        <DetailSection title="Causes" icon="⚠️" dotColor="bg-red-400">
          {disease.causes.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
              {c}
            </li>
          ))}
        </DetailSection>
      </div>

      {/* Treatment & Prevention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailSection title="Treatment" icon="💊" dotColor="bg-blue-400">
          {disease.treatment.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="w-5 h-5 bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0 text-blue-400 text-xs font-mono mt-0.5">{i + 1}</span>
              {t}
            </li>
          ))}
        </DetailSection>

        <DetailSection title="Prevention" icon="🛡️" dotColor="bg-leaf-400">
          {disease.prevention.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="w-1.5 h-1.5 bg-leaf-400 rounded-full mt-1.5 shrink-0" />
              {p}
            </li>
          ))}
        </DetailSection>
      </div>

      {/* Affected Crops & Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card">
          <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Affected Crops</h3>
          <div className="flex flex-wrap gap-2">
            {disease.affectedCrops.map((crop) => (
              <span key={crop} className="bg-forest-dark text-gray-300 text-xs font-mono px-3 py-1.5 rounded-lg border border-leaf-900/40 hover:border-leaf-700/40 transition-colors">{crop}</span>
            ))}
          </div>
        </div>
        <div className="glass-card">
          <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Favorable Conditions</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{disease.favorableConditions}</p>
        </div>
      </div>

      {/* FAQ */}
      {disease.faq.length > 0 && (
        <div className="glass-card">
          <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {disease.faq.map((faq, i) => (
              <div key={i} className="bg-forest-dark/60 rounded-xl p-5 border border-leaf-900/20">
                <p className="text-leaf-400 font-medium mb-2">Q: {faq.q}</p>
                <p className="text-gray-400 text-sm leading-relaxed">A: {faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="glass-card text-center">
        <p className="text-gray-400 mb-4">Think your plant has this disease?</p>
        <Link to="/detection" className="inline-flex items-center gap-2 bg-leaf-600 hover:bg-leaf-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg shadow-leaf-900/30 hover:shadow-leaf-500/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Run AI Detection Now
        </Link>
      </div>
    </div>
  )
}

function DetailSection({ title, icon, children }) {
  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest">{title}</h3>
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  )
}

export default function DiseaseLibrary() {
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All')
  const selectedDisease = DISEASES.find(d => d.id === selectedId)

  const filteredDiseases = useMemo(() => {
    return DISEASES.filter(d => {
      const matchesSearch = search === '' ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase())
      const matchesSeverity = severityFilter === 'All' ||
        d.severity === severityFilter ||
        (severityFilter === 'Healthy' && d.id === 'healthy')
      return matchesSearch && matchesSeverity
    })
  }, [search, severityFilter])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <p className="text-leaf-500 font-mono text-xs uppercase tracking-widest mb-2">Reference Guide</p>
        <h1 className="text-4xl font-display font-bold text-white">Disease Library</h1>
        <p className="text-gray-400 mt-2 max-w-xl">
          Comprehensive reference for all leaf diseases our system can identify. Search, filter, and click any disease for detailed information.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diseases by name, category, or description..."
            className="w-full bg-forest-mid/60 border border-leaf-900/40 rounded-xl pl-12 pr-4 py-3 text-white text-sm outline-none placeholder-gray-600 focus:border-leaf-500/60 focus:ring-2 focus:ring-leaf-600/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Severity Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {SEVERITY_FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setSeverityFilter(filter)}
              className={`text-xs font-mono px-4 py-2 rounded-xl border transition-all ${
                severityFilter === filter
                  ? 'bg-leaf-600/20 text-leaf-400 border-leaf-600/40'
                  : 'bg-forest-mid/40 text-gray-500 border-leaf-900/30 hover:text-gray-300 hover:border-leaf-700/40'
              }`}
            >
              {filter === 'All' ? '🟢 All' : filter === 'Healthy' ? '🟢 Healthy' : filter === 'Moderate' ? '🟡 Moderate' : '🔴 Severe'}
            </button>
          ))}
          {(search || severityFilter !== 'All') && (
            <button
              onClick={() => { setSearch(''); setSeverityFilter('All') }}
              className="text-xs font-mono px-4 py-2 rounded-xl border bg-red-900/20 text-red-400 border-red-600/30 hover:bg-red-900/30 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <p className="text-gray-600 text-xs font-mono">
          Showing {filteredDiseases.length} of {DISEASES.length} diseases
          {search && ` matching "${search}"`}
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Disease List */}
        <div className={`lg:col-span-2 space-y-4 ${selectedDisease ? 'hidden lg:grid lg:grid-cols-1' : 'grid grid-cols-2 lg:grid-cols-2 gap-4'}`}>
          {filteredDiseases.length > 0 ? (
            filteredDiseases.map((disease) => (
              <DiseaseCard
                key={disease.id}
                disease={disease}
                onSelect={setSelectedId}
                isSelected={selectedId === disease.id}
              />
            ))
          ) : (
            <div className="col-span-2 glass-card text-center py-12">
              <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 text-sm">No diseases match your search</p>
              <button
                onClick={() => { setSearch(''); setSeverityFilter('All') }}
                className="text-leaf-400 text-xs font-mono mt-2 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className={`lg:col-span-3 ${!selectedDisease ? 'hidden lg:block' : ''}`}>
          {selectedDisease ? (
            <>
              <button
                onClick={() => setSelectedId(null)}
                className="lg:hidden mb-4 text-leaf-400 text-sm font-mono flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to list
              </button>
              <DiseaseDetail disease={selectedDisease} />
            </>
          ) : (
            <div className="glass-card flex flex-col items-center justify-center py-24 text-center border-dashed h-full">
              <div className="w-24 h-24 bg-forest-dark rounded-3xl flex items-center justify-center mb-6 animate-float-slow border border-leaf-900/30">
                <svg className="w-12 h-12 text-leaf-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-white font-display font-semibold text-lg mb-2">Select a Disease</h3>
              <p className="text-gray-500 text-sm max-w-xs">Click a disease from the list to view detailed information about symptoms, treatment, and prevention</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
