import { useState, useEffect } from 'react'
import { generateReport, listReports, downloadReport, getReportStats } from '../services/api'
import { useToast } from '../components/Toast'

export default function Reports() {
  const { showToast } = useToast()
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({ report_type: 'summary', date_from: '', date_to: '' })

  const load = async () => {
    try {
      setLoading(true)
      const [r, st] = await Promise.all([
        listReports({ per_page: 20 }),
        getReportStats().catch(() => null),
      ])
      setReports(r.items || [])
      setStats(st)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleGenerate = async (e) => {
    e.preventDefault()
    try {
      setGenerating(true)
      await generateReport({
        report_type: form.report_type,
        date_from: form.date_from || undefined,
        date_to: form.date_to || undefined,
      })
      showToast('Report generated!', 'success')
      load()
    } catch (e) { showToast(e.message, 'error') }
    finally { setGenerating(false) }
  }

  const handleDownload = async (reportId, filename) => {
    try {
      const blob = await downloadReport(reportId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'report.html'
      a.click()
      window.URL.revokeObjectURL(url)
      showToast('Downloaded!', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  const typeEmoji = (t) => ({ summary: '📊', detailed: '📋', plant: '🌱', health: '💚', trend: '📈' }[t] || '📄')

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-orange-700">Reports</h1>
      </div>

      <form onSubmit={handleGenerate} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select value={form.report_type} onChange={e => setForm({...form, report_type: e.target.value})} className="border rounded-lg p-2">
          <option value="summary">Summary Report</option>
          <option value="detailed">Detailed Report</option>
          <option value="plant">Plant Report</option>
          <option value="health">Health Report</option>
          <option value="trend">Trend Report</option>
        </select>
        <input type="date" value={form.date_from} onChange={e => setForm({...form, date_from: e.target.value})} className="border rounded-lg p-2" placeholder="From" />
        <input type="date" value={form.date_to} onChange={e => setForm({...form, date_to: e.target.value})} className="border rounded-lg p-2" placeholder="To" />
        <button type="submit" disabled={generating} className="bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </form>

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {reports.length === 0 ? <p className="p-6 text-center text-gray-400">No reports generated yet</p> : (
            <table className="w-full">
              <thead className="bg-gray-50"><tr><th className="p-3 text-left">Type</th><th className="p-3 text-left">Generated</th><th className="p-3 text-left">Period</th><th className="p-3">Actions</th></tr></thead>
              <tbody>{reports.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{typeEmoji(r.report_type)} {r.report_type}</td>
                  <td className="p-3 text-sm text-gray-500">{new Date(r.generated_at).toLocaleString()}</td>
                  <td className="p-3 text-sm text-gray-500">
                    {r.date_from ? `${new Date(r.date_from).toLocaleDateString()} - ${new Date(r.date_to).toLocaleDateString()}` : 'All time'}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDownload(r.id, r.filename)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm hover:bg-blue-200">Download</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
