import { useState, useEffect, useCallback } from 'react'
import {
  getPredictionHistory,
  getStatistics,
  deletePredictionRecord,
  clearPredictionHistory,
} from '../services/api'
import { DISEASE_IMAGES } from '../assets'

const DISEASE_COLORS = {
  'Healthy':        'text-leaf-400 bg-leaf-600/20 border-leaf-600/30',
  'Leaf Spot':      'text-amber-400 bg-amber-600/20 border-amber-600/30',
  'Powdery Mildew': 'text-gray-300 bg-gray-600/20 border-gray-600/30',
  'Rust':           'text-orange-400 bg-orange-600/20 border-orange-600/30',
  'Blight':         'text-red-400 bg-red-600/20 border-red-600/30',
}

function StatCard({ label, value, color = 'text-leaf-400' }) {
  return (
    <div className="card text-center py-5">
      <p className={`text-3xl font-display font-bold ${color} mb-1`}>{value}</p>
      <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">{label}</p>
    </div>
  )
}

function HistoryRow({ record, onDelete }) {
  const isHealthy = record.prediction === 'Healthy'
  const colorClass = DISEASE_COLORS[record.anomaly_type] || DISEASE_COLORS['Leaf Spot']
  const diseaseImage = DISEASE_IMAGES[record.anomaly_type]

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="card hover:border-leaf-700/60 transition-colors group">
      <div className="flex items-center gap-4">
        {/* Disease thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-forest-dark border border-leaf-900/40 shrink-0">
          {diseaseImage ? (
            <img src={diseaseImage} alt={record.anomaly_type} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">
              {isHealthy ? '🟢' : '🟤'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${colorClass}`}>
              {record.anomaly_type}
            </span>
            <span className={`text-xs font-semibold ${isHealthy ? 'text-leaf-400' : 'text-red-400'}`}>
              {record.prediction}
            </span>
          </div>
          <p className="text-gray-500 text-xs font-mono truncate">
            {record.filename || 'uploaded image'} — {formatDate(record.created_at)}
          </p>
        </div>

        {/* Confidence & time */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-white font-mono text-sm font-semibold">{record.confidence}%</p>
          <p className="text-gray-600 text-xs font-mono">{record.processing_time_ms}ms</p>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(record.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 p-2 shrink-0"
          title="Delete record"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function History() {
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('all')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [dbError, setDbError] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setDbError(false)
    try {
      const params = { page, per_page: 10 }
      if (filter === 'healthy') params.prediction = 'Healthy'
      if (filter === 'diseased') params.prediction = 'Diseased'

      const [historyData, statsData] = await Promise.all([
        getPredictionHistory(params).catch(() => null),
        getStatistics().catch(() => null),
      ])

      if (!historyData && !statsData) {
        setDbError(true)
        setRecords([])
        setStats(null)
      } else {
        setRecords(historyData?.items || [])
        setTotalPages(historyData?.total_pages || 1)
        setTotal(historyData?.total || 0)
        setStats(statsData)
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (id) => {
    try {
      await deletePredictionRecord(id)
      fetchData()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleClearAll = async () => {
    try {
      await clearPredictionHistory()
      setShowClearConfirm(false)
      fetchData()
    } catch (err) {
      console.error('Clear failed:', err)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-leaf-500 font-mono text-xs uppercase tracking-widest mb-2">Database Records</p>
          <h1 className="text-4xl font-display font-bold text-white">Prediction History</h1>
          <p className="text-gray-400 mt-2 max-w-xl">
            View all past leaf analysis results stored in MongoDB. Each prediction is automatically saved with full metadata.
          </p>
        </div>
        {total > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 font-medium px-4 py-2 rounded-lg text-sm transition-all shrink-0"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && stats.total_predictions > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Scans" value={stats.total_predictions} />
          <StatCard label="Healthy" value={stats.healthy_count} color="text-leaf-400" />
          <StatCard label="Diseased" value={stats.diseased_count} color="text-red-400" />
          <StatCard label="Avg Confidence" value={`${stats.avg_confidence}%`} color="text-amber-400" />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">Filter:</span>
        {[
          { key: 'all', label: 'All' },
          { key: 'healthy', label: 'Healthy' },
          { key: 'diseased', label: 'Diseased' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setPage(1) }}
            className={`text-sm font-mono px-3 py-1.5 rounded-lg border transition-all ${
              filter === key
                ? 'bg-leaf-600/20 text-leaf-400 border-leaf-600/40'
                : 'text-gray-500 border-leaf-900/40 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="text-gray-600 text-xs font-mono ml-auto">{total} records</span>
      </div>

      {/* Records list */}
      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-leaf-700/40 border-t-leaf-400 rounded-full animate-spin" />
            <span className="text-gray-500 text-sm font-mono">Loading history...</span>
          </div>
        </div>
      ) : dbError ? (
        <div className="card border-amber-800/40 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
            </svg>
          </div>
          <h3 className="text-amber-400 font-semibold mb-2">Database Offline</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-md">
            MongoDB is not connected. History features are unavailable until the database is running.
          </p>
          <div className="bg-forest-dark/60 rounded-xl p-4 text-left max-w-sm w-full">
            <p className="text-xs text-gray-500 font-mono mb-2">Quick fix:</p>
            <code className="text-xs text-leaf-400 font-mono block">
              Make sure MongoDB is running on port 27017
            </code>
            <p className="text-xs text-gray-600 font-mono mt-2">
              Or start everything with Docker:
            </p>
            <code className="text-xs text-leaf-400 font-mono block mt-1">
              docker-compose up --build
            </code>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center border-dashed">
          <div className="w-16 h-16 bg-forest-dark rounded-full flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-leaf-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-1">No prediction records yet</p>
          <p className="text-gray-600 text-xs">Run a detection to start building history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <HistoryRow key={record.id} record={record} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-500 text-sm font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Clear confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card max-w-sm w-full mx-4 animate-slideUp">
            <h3 className="text-white font-semibold text-lg mb-2">Clear All History?</h3>
            <p className="text-gray-400 text-sm mb-6">
              This will permanently delete all {total} prediction records from MongoDB. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleClearAll} className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all flex-1">
                Yes, Clear All
              </button>
              <button onClick={() => setShowClearConfirm(false)} className="btn-secondary py-2 text-sm flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
