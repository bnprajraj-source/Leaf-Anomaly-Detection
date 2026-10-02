import { useState, useEffect } from 'react'
import { getSeasonalAnalysis, getMonthlyData, getBestAndWorstPlants } from '../services/api'
import { useToast } from '../components/Toast'

export default function Seasonal() {
  const { showToast } = useToast()
  const [analysis, setAnalysis] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [bestWorst, setBestWorst] = useState(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  const load = async () => {
    try {
      setLoading(true)
      const [a, m, bw] = await Promise.all([
        getSeasonalAnalysis(year),
        getMonthlyData(year),
        getBestAndWorstPlants(year),
      ])
      setAnalysis(a)
      setMonthly(m.months || [])
      setBestWorst(bw)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [year])

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">Seasonal Analysis</h1>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="border rounded-lg p-2">
          {[0,1,2].map(y => <option key={y} value={new Date().getFullYear() - y}>{new Date().getFullYear() - y}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <>
          {analysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-indigo-600">{analysis.total_scans || 0}</div><div className="text-sm text-gray-500">Total Scans</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-green-600">{analysis.avg_confidence?.toFixed(1) || 0}%</div><div className="text-sm text-gray-500">Avg Confidence</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-red-600">{analysis.healthy_rate?.toFixed(1) || 0}%</div><div className="text-sm text-gray-500">Healthy Rate</div></div>
              <div className="bg-white p-5 rounded-xl shadow text-center"><div className="text-2xl font-bold text-purple-600">{analysis.most_common_disease || 'N/A'}</div><div className="text-sm text-gray-500">Most Common</div></div>
            </div>
          )}

          {monthly.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow mb-6">
              <h2 className="text-xl font-bold mb-4">Monthly Scan Activity</h2>
              <div className="flex items-end gap-2 h-40">
                {monthly.map((m, i) => {
                  const max = Math.max(...monthly.map(x => x.scan_count || 0), 1)
                  const h = (m.scan_count / max) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span className="text-xs text-gray-500 mb-1">{m.scan_count || 0}</span>
                      <div className="w-full bg-indigo-200 rounded-t" style={{ height: `${Math.max(h, 4)}%` }}></div>
                      <span className="text-xs text-gray-400 mt-1">{monthNames[i]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {bestWorst && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-bold text-green-700 mb-4">Best Plants</h2>
                {bestWorst.best_plants?.length === 0 ? <p className="text-gray-400">No data</p> : (
                  <div className="space-y-2">{bestWorst.best_plants?.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span>{p.plant_name}</span>
                      <span className="font-bold text-green-600">{p.health_score?.toFixed(1) || '-'}% healthy</span>
                    </div>
                  ))}</div>
                )}
              </div>
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-bold text-red-700 mb-4">Needs Attention</h2>
                {bestWorst.worst_plants?.length === 0 ? <p className="text-gray-400">No data</p> : (
                  <div className="space-y-2">{bestWorst.worst_plants?.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span>{p.plant_name}</span>
                      <span className="font-bold text-red-600">{p.health_score?.toFixed(1) || '-'}% healthy</span>
                    </div>
                  ))}</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
