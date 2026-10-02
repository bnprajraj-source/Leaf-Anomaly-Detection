import { useState, useEffect } from 'react'
import { getIrrigationLogs, logWatering, getWateringSchedule, getIrrigationStats, getPlants } from '../services/api'
import { useToast } from '../components/Toast'

export default function Irrigation() {
  const { showToast } = useToast()
  const [logs, setLogs] = useState([])
  const [schedule, setSchedule] = useState([])
  const [stats, setStats] = useState(null)
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const [form, setForm] = useState({ plant_id: '', amount_ml: '', method: 'manual', notes: '' })
  const [tab, setTab] = useState('logs')

  const load = async () => {
    try {
      setLoading(true)
      const [l, s, st, p] = await Promise.all([
        getIrrigationLogs({ per_page: 50 }),
        getWateringSchedule(),
        getIrrigationStats(30),
        getPlants({ per_page: 100 }),
      ])
      setLogs(l.items || [])
      setSchedule(s.schedule || [])
      setStats(st)
      setPlants(p.items || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleLog = async (e) => {
    e.preventDefault()
    if (!form.plant_id) return showToast('Select a plant', 'error')
    try {
      await logWatering(form.plant_id, {
        amount_ml: form.amount_ml ? parseFloat(form.amount_ml) : undefined,
        method: form.method,
        notes: form.notes || undefined,
      })
      showToast('Watering logged!', 'success')
      setShowLog(false)
      setForm({ plant_id: '', amount_ml: '', method: 'manual', notes: '' })
      load()
    } catch (e) { showToast(e.message, 'error') }
  }

  const methodIcon = (m) => ({ manual: '🪣', drip: '💧', sprinkler: '🌧️', soaker: ' Hose', flood: '🌊', mist: '🌫️' }[m] || '💧')

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">Irrigation & Watering</h1>
        <button onClick={() => setShowLog(!showLog)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">+ Log Watering</button>
      </div>

      <div className="flex gap-2 mb-6">
        {['logs', 'schedule', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {showLog && (
        <form onSubmit={handleLog} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={form.plant_id} onChange={e => setForm({...form, plant_id: e.target.value})} className="border rounded-lg p-2">
            <option value="">Select plant *</option>
            {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" placeholder="Amount (ml)" value={form.amount_ml} onChange={e => setForm({...form, amount_ml: e.target.value})} className="border rounded-lg p-2" />
          <select value={form.method} onChange={e => setForm({...form, method: e.target.value})} className="border rounded-lg p-2">
            <option value="manual">Manual</option><option value="drip">Drip</option><option value="sprinkler">Sprinkler</option>
            <option value="soaker">Soaker</option><option value="flood">Flood</option><option value="mist">Mist</option>
          </select>
          <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded-lg p-2" />
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button type="button" onClick={() => setShowLog(false)} className="bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <>
          {tab === 'logs' && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {logs.length === 0 ? <p className="p-6 text-center text-gray-400">No watering logs yet</p> : (
                <table className="w-full">
                  <thead className="bg-gray-50"><tr><th className="p-3 text-left">Plant</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Date</th></tr></thead>
                  <tbody>{logs.map(l => (
                    <tr key={l.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{l.plant_name}</td>
                      <td className="p-3 text-center">{l.amount_ml ? `${l.amount_ml}ml` : '-'}</td>
                      <td className="p-3 text-center">{methodIcon(l.method)} {l.method}</td>
                      <td className="p-3 text-sm text-gray-500">{new Date(l.watered_at).toLocaleDateString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'schedule' && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Upcoming Schedule</h2>
              {schedule.length === 0 ? <p className="text-gray-400">No watering schedules set</p> : (
                <div className="space-y-3">{schedule.map((s, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${s.is_overdue ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <div><span className="font-medium">{s.plant_name}</span><span className="text-gray-500 ml-2">Every {s.interval_days} days</span></div>
                    <span className={`text-sm px-2 py-1 rounded ${s.is_overdue ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>{s.is_overdue ? 'Overdue' : `Next: ${new Date(s.next_scheduled).toLocaleDateString()}`}</span>
                  </div>
                ))}</div>
              )}
            </div>
          )}

          {tab === 'stats' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-blue-600">{stats.stats?.total_waterings || 0}</div><div className="text-sm text-gray-500">Total Waterings</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-cyan-600">{stats.stats?.total_water_ml ? `${(stats.stats.total_water_ml / 1000).toFixed(1)}L` : '0L'}</div><div className="text-sm text-gray-500">Total Water Used</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-green-600">{stats.stats?.unique_plants || 0}</div><div className="text-sm text-gray-500">Plants Watered</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-purple-600">{stats.stats?.avg_water_ml ? `${stats.stats.avg_water_ml.toFixed(0)}ml` : '0ml'}</div><div className="text-sm text-gray-500">Avg per Watering</div></div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
