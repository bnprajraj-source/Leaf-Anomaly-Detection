import { useState, useEffect } from 'react'
import { getTreatmentStats, getActiveTreatments } from '../services/api'
import { useToast } from '../components/Toast'

export default function Dashboard() {
  const { showToast } = useToast()
  const [stats, setStats] = useState(null)
  const [activeTreatments, setActiveTreatments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t] = await Promise.all([
          getTreatmentStats().catch(() => null),
          getActiveTreatments().catch(() => ({ active_treatments: [] })),
        ])
        setStats(s)
        setActiveTreatments(t.active_treatments || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading dashboard...</div></div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow text-center">
          <div className="text-3xl font-bold text-green-600">{stats?.total_plants || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Plants</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow text-center">
          <div className="text-3xl font-bold text-blue-600">{stats?.healthy_plants || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Healthy Plants</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow text-center">
          <div className="text-3xl font-bold text-red-600">{stats?.diseased_plants || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Diseased Plants</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow text-center">
          <div className="text-3xl font-bold text-purple-600">{activeTreatments.length}</div>
          <div className="text-sm text-gray-500 mt-1">Active Treatments</div>
        </div>
      </div>

      {activeTreatments.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Active Treatments</h2>
          <div className="space-y-3">
            {activeTreatments.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <span className="font-medium">{t.plant_name}</span>
                  <span className="text-gray-500 ml-2">- {t.disease_name}</span>
                </div>
                <span className="text-sm bg-yellow-200 px-2 py-1 rounded">{t.treatment_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="/detection" className="bg-green-100 text-green-700 p-4 rounded-lg text-center hover:bg-green-200 transition">Scan Leaf</a>
          <a href="/plants" className="bg-blue-100 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-200 transition">My Plants</a>
          <a href="/history" className="bg-purple-100 text-purple-700 p-4 rounded-lg text-center hover:bg-purple-200 transition">History</a>
          <a href="/reports" className="bg-orange-100 text-orange-700 p-4 rounded-lg text-center hover:bg-orange-200 transition">Reports</a>
        </div>
      </div>
    </div>
  )
}
