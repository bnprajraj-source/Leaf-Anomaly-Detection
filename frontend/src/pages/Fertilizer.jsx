import { useState, useEffect } from 'react'
import { getFertilizerLogs, logFertilizer, getFertilizerSchedule, getFertilizerStats, getPlants } from '../services/api'
import { useToast } from '../components/Toast'

export default function Fertilizer() {
  const { showToast } = useToast()
  const [logs, setLogs] = useState([])
  const [schedule, setSchedule] = useState([])
  const [stats, setStats] = useState(null)
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const [form, setForm] = useState({ plant_id: '', fertilizer_type: '', npk: '', amount_grams: '', method: 'soil_drench', notes: '' })
  const [tab, setTab] = useState('logs')

  const load = async () => {
    try {
      setLoading(true)
      const [l, s, st, p] = await Promise.all([
        getFertilizerLogs({ per_page: 50 }),
        getFertilizerSchedule(),
        getFertilizerStats(30),
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
    if (!form.plant_id || !form.fertilizer_type) return showToast('Plant and fertilizer type required', 'error')
    try {
      const npk = form.npk.split('/').map(Number)
      await logFertilizer(form.plant_id, {
        fertilizer_type: form.fertilizer_type,
        npk_ratio: npk.length === 3 ? { n: npk[0], p: npk[1], k: npk[2] } : undefined,
        amount_grams: form.amount_grams ? parseFloat(form.amount_grams) : undefined,
        method: form.method,
        notes: form.notes || undefined,
      })
      showToast('Fertilizer logged!', 'success')
      setShowLog(false)
      setForm({ plant_id: '', fertilizer_type: '', npk: '', amount_grams: '', method: 'soil_drench', notes: '' })
      load()
    } catch (e) { showToast(e.message, 'error') }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-emerald-700">Fertilizer Tracking</h1>
        <button onClick={() => setShowLog(!showLog)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">+ Log Fertilizer</button>
      </div>

      <div className="flex gap-2 mb-6">
        {['logs', 'schedule', 'stats'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {showLog && (
        <form onSubmit={handleLog} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={form.plant_id} onChange={e => setForm({...form, plant_id: e.target.value})} className="border rounded-lg p-2">
            <option value="">Select plant *</option>
            {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input placeholder="Fertilizer type (e.g. Compost, NPK 20-20-20) *" value={form.fertilizer_type} onChange={e => setForm({...form, fertilizer_type: e.target.value})} className="border rounded-lg p-2" />
          <input placeholder="NPK ratio (e.g. 10/10/10)" value={form.npk} onChange={e => setForm({...form, npk: e.target.value})} className="border rounded-lg p-2" />
          <input type="number" placeholder="Amount (grams)" value={form.amount_grams} onChange={e => setForm({...form, amount_grams: e.target.value})} className="border rounded-lg p-2" />
          <select value={form.method} onChange={e => setForm({...form, method: e.target.value})} className="border rounded-lg p-2">
            <option value="soil_drench">Soil Drench</option><option value="foliar_spray">Foliar Spray</option>
            <option value="top_dress">Top Dress</option><option value="side_dress">Side Dress</option><option value="injection">Injection</option>
          </select>
          <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded-lg p-2" />
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button type="button" onClick={() => setShowLog(false)} className="bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <>
          {tab === 'logs' && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {logs.length === 0 ? <p className="p-6 text-center text-gray-400">No fertilizer logs yet</p> : (
                <table className="w-full">
                  <thead className="bg-gray-50"><tr><th className="p-3 text-left">Plant</th><th className="p-3">Type</th><th className="p-3">NPK</th><th className="p-3">Amount</th><th className="p-3">Date</th></tr></thead>
                  <tbody>{logs.map(l => (
                    <tr key={l.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{l.plant_name}</td>
                      <td className="p-3 text-center">{l.fertilizer_type}</td>
                      <td className="p-3 text-center text-sm">{l.npk_ratio ? `${l.npk_ratio.n}/${l.npk_ratio.p}/${l.npk_ratio.k}` : '-'}</td>
                      <td className="p-3 text-center">{l.amount_grams ? `${l.amount_grams}g` : '-'}</td>
                      <td className="p-3 text-sm text-gray-500">{new Date(l.applied_at).toLocaleDateString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'schedule' && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Upcoming Fertilizer Schedule</h2>
              {schedule.length === 0 ? <p className="text-gray-400">No schedules set</p> : (
                <div className="space-y-3">{schedule.map((s, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${s.is_overdue ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <div><span className="font-medium">{s.plant_name}</span><span className="text-gray-500 ml-2">- {s.fertilizer_type}</span></div>
                    <span className={`text-sm px-2 py-1 rounded ${s.is_overdue ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-800'}`}>{s.is_overdue ? 'Overdue' : `Every ${s.interval_days} days`}</span>
                  </div>
                ))}</div>
              )}
            </div>
          )}

          {tab === 'stats' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-emerald-600">{stats.stats?.total_applications || 0}</div><div className="text-sm text-gray-500">Total Applications</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-green-600">{stats.stats?.total_amount_grams ? `${stats.stats.total_amount_grams.toFixed(0)}g` : '0g'}</div><div className="text-sm text-gray-500">Total Applied</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-blue-600">{stats.stats?.unique_plants || 0}</div><div className="text-sm text-gray-500">Plants Treated</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-purple-600">{stats.stats?.avg_per_application ? `${stats.stats.avg_per_application.toFixed(1)}g` : '0g'}</div><div className="text-sm text-gray-500">Avg per Application</div></div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
