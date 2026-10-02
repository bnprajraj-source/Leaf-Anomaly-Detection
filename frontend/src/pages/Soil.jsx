import { useState, useEffect } from 'react'
import { getSoilLogs, logSoilAnalysis, getSoilStats, getPlants } from '../services/api'
import { useToast } from '../components/Toast'

export default function Soil() {
  const { showToast } = useToast()
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const [form, setForm] = useState({ plant_id: '', ph: '', nitrogen: '', phosphorus: '', potassium: '', moisture_percent: '', temperature_celsius: '', notes: '' })

  const load = async () => {
    try {
      setLoading(true)
      const [l, st, p] = await Promise.all([
        getSoilLogs({ per_page: 50 }),
        getSoilStats(),
        getPlants({ per_page: 100 }),
      ])
      setLogs(l.items || [])
      setStats(st)
      setPlants(p.items || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleLog = async (e) => {
    e.preventDefault()
    try {
      await logSoilAnalysis(form.plant_id || undefined, {
        ph: form.ph ? parseFloat(form.ph) : undefined,
        nitrogen: form.nitrogen ? parseFloat(form.nitrogen) : undefined,
        phosphorus: form.phosphorus ? parseFloat(form.phosphorus) : undefined,
        potassium: form.potassium ? parseFloat(form.potassium) : undefined,
        moisture_percent: form.moisture_percent ? parseFloat(form.moisture_percent) : undefined,
        temperature_celsius: form.temperature_celsius ? parseFloat(form.temperature_celsius) : undefined,
        notes: form.notes || undefined,
      })
      showToast('Soil analysis logged!', 'success')
      setShowLog(false)
      setForm({ plant_id: '', ph: '', nitrogen: '', phosphorus: '', potassium: '', moisture_percent: '', temperature_celsius: '', notes: '' })
      load()
    } catch (e) { showToast(e.message, 'error') }
  }

  const phColor = (ph) => {
    if (!ph) return 'text-gray-400'
    if (ph < 5.5) return 'text-red-600'
    if (ph < 6.0) return 'text-orange-600'
    if (ph <= 7.5) return 'text-green-600'
    if (ph <= 8.0) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-700">Soil Analysis</h1>
        <button onClick={() => setShowLog(!showLog)} className="bg-amber-600 text-white px-4 py-2 rounded-lg">+ Log Soil Test</button>
      </div>

      {showLog && (
        <form onSubmit={handleLog} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={form.plant_id} onChange={e => setForm({...form, plant_id: e.target.value})} className="border rounded-lg p-2">
            <option value="">Select plant (optional)</option>
            {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" step="0.1" placeholder="pH" value={form.ph} onChange={e => setForm({...form, ph: e.target.value})} className="border rounded-lg p-2" />
          <input type="number" step="0.1" placeholder="Nitrogen (ppm)" value={form.nitrogen} onChange={e => setForm({...form, nitrogen: e.target.value})} className="border rounded-lg p-2" />
          <input type="number" step="0.1" placeholder="Phosphorus (ppm)" value={form.phosphorus} onChange={e => setForm({...form, phosphorus: e.target.value})} className="border rounded-lg p-2" />
          <input type="number" step="0.1" placeholder="Potassium (ppm)" value={form.potassium} onChange={e => setForm({...form, potassium: e.target.value})} className="border rounded-lg p-2" />
          <input type="number" step="0.1" placeholder="Moisture %" value={form.moisture_percent} onChange={e => setForm({...form, moisture_percent: e.target.value})} className="border rounded-lg p-2" />
          <input type="number" step="0.1" placeholder="Temperature °C" value={form.temperature_celsius} onChange={e => setForm({...form, temperature_celsius: e.target.value})} className="border rounded-lg p-2" />
          <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded-lg p-2" />
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button type="button" onClick={() => setShowLog(false)} className="bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow text-center"><div className="text-xl font-bold text-amber-600">{stats.avg_ph?.toFixed(1) || '-'}</div><div className="text-xs text-gray-500">Avg pH</div></div>
              <div className="bg-white p-4 rounded-xl shadow text-center"><div className="text-xl font-bold text-green-600">{stats.avg_nitrogen?.toFixed(0) || '-'}<span className="text-xs">ppm</span></div><div className="text-xs text-gray-500">Avg Nitrogen</div></div>
              <div className="bg-white p-4 rounded-xl shadow text-center"><div className="text-xl font-bold text-blue-600">{stats.avg_phosphorus?.toFixed(0) || '-'}<span className="text-xs">ppm</span></div><div className="text-xs text-gray-500">Avg Phosphorus</div></div>
              <div className="bg-white p-4 rounded-xl shadow text-center"><div className="text-xl font-bold text-purple-600">{stats.avg_potassium?.toFixed(0) || '-'}<span className="text-xs">ppm</span></div><div className="text-xs text-gray-500">Avg Potassium</div></div>
              <div className="bg-white p-4 rounded-xl shadow text-center"><div className="text-xl font-bold text-cyan-600">{stats.avg_moisture?.toFixed(1) || '-'}<span className="text-xs">%</span></div><div className="text-xs text-gray-500">Avg Moisture</div></div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-hidden">
            {logs.length === 0 ? <p className="p-6 text-center text-gray-400">No soil tests logged yet</p> : (
              <table className="w-full">
                <thead className="bg-gray-50"><tr>
                  <th className="p-3 text-left">Date</th><th className="p-3">pH</th><th className="p-3">N</th><th className="p-3">P</th><th className="p-3">K</th><th className="p-3">Moisture</th><th className="p-3">Temp</th>
                </tr></thead>
                <tbody>{logs.map(l => (
                  <tr key={l.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm">{new Date(l.tested_at).toLocaleDateString()}</td>
                    <td className={`p-3 text-center font-bold ${phColor(l.ph)}`}>{l.ph?.toFixed(1) || '-'}</td>
                    <td className="p-3 text-center">{l.nitrogen?.toFixed(0) || '-'}</td>
                    <td className="p-3 text-center">{l.phosphorus?.toFixed(0) || '-'}</td>
                    <td className="p-3 text-center">{l.potassium?.toFixed(0) || '-'}</td>
                    <td className="p-3 text-center">{l.moisture_percent?.toFixed(1) || '-'}%</td>
                    <td className="p-3 text-center">{l.temperature_celsius?.toFixed(1) || '-'}°C</td>
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
