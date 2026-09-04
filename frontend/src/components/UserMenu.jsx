import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function getInitials(user) {
  const name = user.full_name || user.name || user.email || ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getAvatarColor(email) {
  const colors = [
    'from-leaf-600 to-leaf-800',
    'from-emerald-600 to-emerald-800',
    'from-teal-600 to-teal-800',
    'from-green-600 to-green-800',
    'from-cyan-600 to-cyan-800',
  ]
  let hash = 0
  for (let i = 0; i < (email || '').length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setOpen(false)
  }

  if (!user) return null

  const displayName = user.full_name || user.name || user.email?.split('@')[0] || 'User'
  const avatarGradient = getAvatarColor(user.email)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 group"
      >
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center border border-white/10 group-hover:border-leaf-500/60 transition-colors shadow-md`}>
          <span className="text-white text-xs font-bold">{getInitials(user)}</span>
        </div>
        <span className="text-gray-300 text-sm font-medium hidden sm:block group-hover:text-white transition-colors">
          {displayName}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 glass-card p-2 z-50 animate-slideUp">
          <div className="px-3 py-2 border-b border-leaf-900/40 mb-1">
            <p className="text-white text-sm font-medium">{displayName}</p>
            <p className="text-gray-500 text-xs font-mono truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-600/10 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
