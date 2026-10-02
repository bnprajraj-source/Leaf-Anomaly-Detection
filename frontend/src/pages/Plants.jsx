import { useState, useEffect } from 'react'
import { getPlants, registerPlant, deletePlant, getPlantStats } from '../services/api'
import { useToast } from '../components/Toast'

export default function Plants() {
  const { showToast } = useToast()
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', species: '', notes: '' })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [stats, setStats] = useState(null)

  const loadPlants = async () => {
    try {
      setLoading(true)
      const params = { per_page: 50 }
      if (search) params.search = search
      if (filter !== 'all') params.health_status = filter
      const data = await getPlants(params)
      setPlants(data.items || [])
    } catch (e) {
      showToast('Failed to load plants', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPlants() }, [search, filter])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return showToast('Name is required', 'error')
    try {
      await registerPlant(form.name, form.species || null, null, form.notes || null)
      showToast('Plant registered!', 'success')
      setForm({ name: '', species: '', notes: '' })
      setShowAdd(false)
      loadPlants()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its history?`)) return
    try {
      await deletePlant(id)
      showToast('Plant deleted', 'success')
      loadPlants()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const loadStats = async (id) => {
    try {
      const data = await getPlantStats(id)
      setSelectedPlant(data)
    } catch (e) {
      showToast('Failed to load stats', 'error')
    }
  }

  const statusColor = (s) => {
    if (s === 'healthy') return 'bg-green-100 text-green-800'
    if (s === 'diseased') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">My Plants</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + Add Plant
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="Plant name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border rounded-lg p-2" />
          <input placeholder="Species (optional)" value={form.species} onChange={e => setForm({...form, species: e.target.value})} className="border rounded-lg p-2" />
          <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded-lg p-2" />
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-4 mb-4">
        <input placeholder="Search plants..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded-lg p-2 flex-1" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg p-2">
          <option value="all">All Status</option>
          <option value="healthy">Healthy</option>
          <option value="diseased">Diseased</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : plants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <p className="text-gray-500 text-lg">No plants yet</p>
          <p className="text-gray-400 mt-2">Click "+ Add Plant" to register your first plant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plants.map(plant => (
            <div key={plant.id} className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{plant.name}</h3>
                  {plant.species && <p className="text-sm text-gray-500">{plant.species}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor(plant.health_status)}`}>
                  {plant.health_status || 'unknown'}
                </span>
              </div>
              {plant.notes && <p className="text-sm text-gray-600 mb-3">{plant.notes}</p>}
              <div className="text-xs text-gray-400 mb-3">Scans: {plant.scan_count || 0}</div>
              <div className="flex gap-2">
                <button onClick={() => loadStats(plant.id)} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg">Stats</button>
                <button onClick={() => handleDelete(plant.id, plant.name)} className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-lg">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPlant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPlant(null)}>
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{selectedPlant.plant_name} - Stats</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{selectedPlant.total_scans}</div>
                <div className="text-sm text-gray-500">Total Scans</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedPlant.healthy_count}</div>
                <div className="text-sm text-gray-500">Healthy</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{selectedPlant.diseased_count}</div>
                <div className="text-sm text-gray-500">Diseased</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{selectedPlant.avg_confidence}%</div>
                <div className="text-sm text-gray-500">Avg Confidence</div>
              </div>
            </div>
            <button onClick={() => setSelectedPlant(null)} className="w-full bg-gray-200 py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
