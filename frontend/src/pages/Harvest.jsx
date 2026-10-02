import { useState, useEffect } from 'react'
import { getHarvests, logHarvest, getHarvestStats, getPlants } from '../services/api'
import { useToast } from '../components/Toast'

export default function Harvest() {
  const { showToast } = useToast()
  const [harvests, setHarvests] = useState([])
  const [stats, setStats] = useState(null)
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const [form, setForm] = useState({ plant_id: '', quantity: '', unit: 'kg', quality: 'good', notes: '' })

  const load = async () => {
    try {
      setLoading(true)
      const [h, st, p] = await Promise.all([
        getHarvests({ per_page: 50 }),
        getHarvestStats(),
        getPlants({ per_page: 100 }),
      ])
      setHarvests(h.items || [])
      setStats(st)
      setPlants(p.items || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleLog = async (e) => {
    e.preventDefault()
    if (!form.plant_id || !form.quantity) return showToast('Plant and quantity required', 'error')
    try {
      await logHarvest(form.plant_id, {
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        quality: form.quality,
        notes: form.notes || undefined,
      })
      showToast('Harvest logged!', 'success')
      setShowLog(false)
      setForm({ plant_id: '', quantity: '', unit: 'kg', quality: 'good', notes: '' })
      load()
    } catch (e) { showToast(e.message, 'error') }
  }

  const qualityColor = (q) => ({ excellent: 'bg-green-100 text-green-800', good: 'bg-blue-100 text-blue-800', average: 'bg-yellow-100 text-yellow-800', poor: 'bg-red-100 text-red-800' }[q] || 'bg-gray-100 text-gray-800')

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-700">Harvest Tracking</h1>
        <button onClick={() => setShowLog(!showLog)} className="bg-yellow-600 text-white px-4 py-2 rounded-lg">+ Log Harvest</button>
      </div>

      {showLog && (
        <form onSubmit={handleLog} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={form.plant_id} onChange={e => setForm({...form, plant_id: e.target.value})} className="border rounded-lg p-2">
            <option value="">Select plant *</option>
            {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" step="0.1" placeholder="Quantity *" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="border rounded-lg p-2" />
          <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="border rounded-lg p-2">
            <option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option><option value="oz">oz</option><option value="pieces">pieces</option><option value="bunches">bunches</option>
          </select>
          <select value={form.quality} onChange={e => setForm({...form, quality: e.target.value})} className="border rounded-lg p-2">
            <option value="excellent">Excellent</option><option value="good">Good</option><option value="average">Average</option><option value="poor">Poor</option>
          </select>
          <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded-lg p-2" />
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button type="button" onClick={() => setShowLog(false)} className="bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-yellow-600">{stats.total_harvests}</div><div className="text-sm text-gray-500">Total Harvests</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-green-600">{stats.total_quantity?.toFixed(1) || 0}</div><div className="text-sm text-gray-500">Total Quantity</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-blue-600">{stats.unique_plants}</div><div className="text-sm text-gray-500">Plants Harvested</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-purple-600">{stats.avg_quality_score?.toFixed(1) || '-'}</div><div className="text-sm text-gray-500">Avg Quality Score</div></div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-hidden">
            {harvests.length === 0 ? <p className="p-6 text-center text-gray-400">No harvests logged yet</p> : (
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="p-3 text-left">Plant</th><th className="p-3">Quantity</th><th className="p-3">Quality</th><th className="p-3">Date</th></tr></thead>
                <tbody>{harvests.map(h => (
                  <tr key={h.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{h.plant_name}</td>
                    <td className="p-3 text-center font-bold">{h.quantity} {h.unit}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${qualityColor(h.quality)}`}>{h.quality}</span></td>
                    <td className="p-3 text-sm text-gray-500">{new Date(h.harvested_at).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
