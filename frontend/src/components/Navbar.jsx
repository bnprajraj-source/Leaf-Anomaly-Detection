import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import ApiStatus from './ApiStatus'
import UserMenu from './UserMenu'

const NAV_LINKS = [
  { to: '/',          label: 'Home' },
  { to: '/detection', label: 'Detection' },
  { to: '/diseases',  label: 'Diseases' },
  { to: '/history',   label: 'History' },
  { to: '/about',     label: 'About' },
]

const FARM_LINKS = [
  { to: '/dashboard',  label: 'Dashboard', icon: '📊' },
  { to: '/plants',     label: 'My Plants', icon: '🌱' },
  { to: '/growth',     label: 'Growth Stages', icon: '📈' },
  { to: '/irrigation', label: 'Irrigation', icon: '💧' },
  { to: '/fertilizer', label: 'Fertilizer', icon: '🧪' },
  { to: '/soil',       label: 'Soil Analysis', icon: '🌍' },
  { to: '/harvest',    label: 'Harvest', icon: '🌾' },
  { to: '/expenses',   label: 'Expenses', icon: '💰' },
  { to: '/seasonal',   label: 'Seasonal', icon: '📅' },
  { to: '/reports',    label: 'Reports', icon: '📋' },
  { to: '/import',     label: 'Import', icon: '📤' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [farmOpen, setFarmOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 glass-nav">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-leaf-gradient rounded-xl flex items-center justify-center shadow-lg shadow-leaf-900/50 group-hover:shadow-leaf-600/30 transition-shadow">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M17 8C8 10 5.9 16.17 3.82 19.82C4.5 18.5 6 16 8 14c-1 2-1.5 4-1.5 6 0 0 3-3 6-6-1 2-1.5 4-1.5 6 0 0 4-4 6.5-9.5.8-1.8 1-3.5 1-4.5 0 0-1 1-2.5 1.5C17 7 17 8 17 8z" fill="#4ade80"/>
              <path d="M12 22s0-4 2-8c-2 2-5 6-5 6" fill="#22c55e" opacity="0.7"/>
            </svg>
          </div>
          <div>
            <span className="font-display font-semibold text-white text-sm leading-none block">LeafScan</span>
            <span className="text-leaf-500 text-[10px] font-mono tracking-widest leading-none">ANOMALY DETECTION</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link text-sm ${isActive ? 'text-leaf-400 font-semibold' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
          {/* Farm Management Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFarmOpen(!farmOpen)}
              className="nav-link text-sm text-gray-300 hover:text-white flex items-center gap-1"
            >
              Farm <span className="text-xs">▾</span>
            </button>
            {farmOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-forest-dark/95 backdrop-blur-xl border border-leaf-900/40 rounded-xl shadow-2xl py-2 animate-slideDown">
                {FARM_LINKS.map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setFarmOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2 text-sm transition-all ${
                        isActive
                          ? 'bg-leaf-900/30 text-leaf-400'
                          : 'text-gray-400 hover:text-white hover:bg-forest-mid/60'
                      }`
                    }
                  >
                    <span>{icon}</span> {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          <ApiStatus />
          <Link to="/detection" className="btn-primary py-2 px-4 text-sm">
            Analyze Leaf
          </Link>
          <UserMenu />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-forest-mid/60 transition-all"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-leaf-900/40 bg-forest-dark/95 backdrop-blur-xl animate-slideDown">
          <div className="px-6 py-4 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-leaf-900/30 text-leaf-400 border border-leaf-700/30'
                      : 'text-gray-400 hover:text-white hover:bg-forest-mid/60'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-leaf-900/30">
              <p className="text-xs text-gray-500 px-4 mb-1 uppercase tracking-wider">Farm Management</p>
              {FARM_LINKS.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                      isActive
                        ? 'bg-leaf-900/30 text-leaf-400'
                        : 'text-gray-400 hover:text-white hover:bg-forest-mid/60'
                    }`
                  }
                >
                  <span>{icon}</span> {label}
                </NavLink>
              ))}
            </div>
            <div className="pt-3 border-t border-leaf-900/30">
              <Link
                to="/detection"
                onClick={() => setMobileOpen(false)}
                className="btn-primary w-full py-3 text-sm text-center block"
              >
                Analyze Leaf
              </Link>
            </div>
            <div className="flex items-center justify-between pt-2">
              <ApiStatus />
              <UserMenu />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
