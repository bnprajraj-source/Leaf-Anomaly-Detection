import { useState, useEffect } from 'react'
import { checkHealth } from '../services/api'

export default function ApiStatus() {
  const [mlStatus, setMlStatus] = useState('checking')
  const [dbStatus, setDbStatus] = useState('checking')

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const data = await checkHealth()
        if (mounted) {
          setMlStatus(data.status === 'healthy' ? 'ok' : 'degraded')
          setDbStatus(data.db_connected ? 'ok' : 'degraded')
        }
      } catch {
        if (mounted) {
          setMlStatus('offline')
          setDbStatus('offline')
        }
      }
    }
    check()
    const interval = setInterval(check, 15000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  const getStatusColor = (s) => {
    if (s === 'ok') return 'bg-leaf-600/20 text-leaf-400 border-leaf-600/30'
    if (s === 'degraded') return 'bg-amber-600/20 text-amber-400 border-amber-600/30'
    if (s === 'offline') return 'bg-red-600/20 text-red-400 border-red-600/30'
    return 'bg-gray-600/20 text-gray-400 border-gray-600/30'
  }

  const getStatusDot = (s) => {
    if (s === 'ok') return 'bg-leaf-400 animate-pulse'
    if (s === 'degraded') return 'bg-amber-400 animate-pulse'
    if (s === 'offline') return 'bg-red-400'
    return 'bg-gray-400 animate-pulse'
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono ${getStatusColor(mlStatus)}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(mlStatus)}`} />
        ML
      </div>
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono ${getStatusColor(dbStatus)}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(dbStatus)}`} />
        MongoDB
      </div>
    </div>
  )
}
