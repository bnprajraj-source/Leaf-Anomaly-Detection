import { useState, useEffect } from 'react'
import { getGrowthStages, recordGrowthStage, getGrowthTimeline, getAvailableGrowthStages, getPlants } from '../services/api'
import { useToast } from '../components/Toast'

export default function Growth() {
  const { showToast } = useToast()
  const [stages, setStages] = useState([])
  const [plants, setPlants] = useState([])
  const [availableStages, setAvailableStages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [form, setForm] = useState({ plant_id: '', stage: '', height_cm: '', notes: '' })

  const load = async () => {
    try {
      setLoading(true)
      const [s, p, a] = await Promise.all([
        getGrowthStages({ per_page: 50 }),
        getPlants({ per_page: 100 }),
        getAvailableGrowthStages(),
      ])
      setStages(s.items || [])
      setPlants(p.items || [])
      setAvailableStages(a.stages || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const loadTimeline = async (plantId) => {
    try {
      const data = await getGrowthTimeline(plantId)
      setTimeline(data.timeline || [])
      setSelectedPlant(plantId)
    } catch (e) { showToast('Failed to load timeline', 'error') }
  }

  const handleLog = async (e) => {
    e.preventDefault()
    if (!form.plant_id || !form.stage) return showToast('Plant and stage required', 'error')
    try {
      await recordGrowthStage(form.plant_id, form.stage, {
        height_cm: form.height_cm ? parseFloat(form.height_cm) : undefined,
        notes: form.notes || undefined,
      })
      showToast('Growth stage recorded!', 'success')
      setShowLog(false)
      setForm({ plant_id: '', stage: '', height_cm: '', notes: '' })
      load()
    } catch (e) { showToast(e.message, 'error') }
  }

  const stageEmoji = (s) => ({ seed: '🫘', seedling: '🌱', vegetative: '🌿', flowering: '🌸', fruiting: '🍅', harvest: '🌾', dormant: '😴' }[s] || '🌱')

  const stageColor = (s) => {
    const colors = { seed: 'bg-amber-100 text-amber-800', seedling: 'bg-green-100 text-green-800', vegetative: 'bg-emerald-100 text-emerald-800', flowering: 'bg-pink-100 text-pink-800', fruiting: 'bg-orange-100 text-orange-800', harvest: 'bg-yellow-100 text-yellow-800', dormant: 'bg-gray-100 text-gray-800' }
    return colors[s] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-emerald-700">Growth Stage Tracking</h1>
        <button onClick={() => setShowLog(!showLog)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">+ Record Stage</button>
      </div>

      {showLog && (
        <form onSubmit={handleLog} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={form.plant_id} onChange={e => setForm({...form, plant_id: e.target.value})} className="border rounded-lg p-2">
            <option value="">Select plant *</option>
            {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})} className="border rounded-lg p-2">
            <option value="">Select stage *</option>
            {availableStages.map(s => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>
          <input type="number" placeholder="Height (cm)" value={form.height_cm} onChange={e => setForm({...form, height_cm: e.target.value})} className="border rounded-lg p-2" />
          <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded-lg p-2" />
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button type="button" onClick={() => setShowLog(false)} className="bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <>
          {stages.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow text-center"><p className="text-gray-400 text-lg">No growth records yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {stages.map(s => (
                <div key={s.id} className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition cursor-pointer" onClick={() => loadTimeline(s.plant_id)}>
                  <div className="flex justify-between items-start">
                    <div><h3 className="font-bold">{s.plant_name}</h3><p className="text-sm text-gray-500">Last recorded: {new Date(s.recorded_at).toLocaleDateString()}</p></div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageColor(s.current_stage)}`}>{stageEmoji(s.current_stage)} {s.current_stage}</span>
                  </div>
                  {s.height_cm && <p className="text-sm text-gray-600 mt-2">Height: {s.height_cm} cm</p>}
                </div>
              ))}
            </div>
          )}

          {selectedPlant && timeline.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-bold mb-4">Growth Timeline</h2>
              <div className="relative border-l-2 border-emerald-300 ml-4 space-y-4">
                {timeline.map((t, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <div className="flex justify-between"><span className={`px-2 py-0.5 rounded text-xs font-medium ${stageColor(t.stage)}`}>{stageEmoji(t.stage)} {t.stage}</span><span className="text-xs text-gray-400">{new Date(t.recorded_at).toLocaleDateString()}</span></div>
                      {t.height_cm && <p className="text-sm text-gray-600 mt-1">Height: {t.height_cm} cm</p>}
                      {t.notes && <p className="text-sm text-gray-500 mt-1">{t.notes}</p>}
                      {t.duration_days && <p className="text-xs text-gray-400 mt-1">Duration: {t.duration_days} days</p>}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelectedPlant(null)} className="mt-4 text-sm text-gray-500 hover:text-gray-700">← Close timeline</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
