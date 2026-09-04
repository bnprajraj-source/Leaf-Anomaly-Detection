import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-forest-dark border-t border-leaf-900/40">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-leaf-600/20 rounded-xl flex items-center justify-center border border-leaf-600/30">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.82C4.5 18.5 6 16 8 14c-1 2-1.5 4-1.5 6 0 0 3-3 6-6-1 2-1.5 4-1.5 6 0 0 4-4 6.5-9.5.8-1.8 1-3.5 1-4.5 0 0-1 1-2.5 1.5C17 7 17 8 17 8z" fill="#4ade80"/>
                </svg>
              </div>
              <div>
                <span className="text-white font-display font-bold text-lg leading-none">LeafScan</span>
                <p className="text-leaf-500 text-[10px] font-mono tracking-widest">ANOMALY DETECTION</p>
              </div>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              AI-powered plant health diagnostics using attention-based deep learning. Detect leaf diseases early, get treatment recommendations, and protect your crops.
            </p>
            <div className="flex gap-3">
              {[
                { label: 'GitHub', icon: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' },
                { label: 'Twitter', icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
              ].map(({ label, icon }) => (
                <a
                  key={label}
                  href="#"
                  className="w-9 h-9 bg-forest-mid border border-leaf-900/40 rounded-lg flex items-center justify-center text-gray-500 hover:text-leaf-400 hover:border-leaf-700/40 transition-all"
                  title={label}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={icon}/></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: 'Home' },
                { to: '/detection', label: 'Disease Detection' },
                { to: '/diseases', label: 'Disease Library' },
                { to: '/history', label: 'Scan History' },
                { to: '/about', label: 'How It Works' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-500 hover:text-leaf-400 text-sm transition-colors duration-200">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Diseases */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Diseases</h4>
            <ul className="space-y-2.5">
              {[
                { icon: '🟢', label: 'Healthy Leaf' },
                { icon: '🟤', label: 'Leaf Spot' },
                { icon: '⬜', label: 'Powdery Mildew' },
                { icon: '🟠', label: 'Rust Disease' },
                { icon: '⬛', label: 'Blight' },
              ].map(({ icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-gray-500 text-sm">
                  <span>{icon}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Technology</h4>
            <ul className="space-y-2.5">
              {[
                'ResNet-50 + CBAM Attention',
                'MAML Meta-Learning',
                'FastAPI Backend',
                'React + Tailwind CSS',
                'MongoDB Database',
              ].map((tech) => (
                <li key={tech} className="flex items-center gap-2 text-gray-500 text-sm">
                  <span className="w-1.5 h-1.5 bg-leaf-600 rounded-full shrink-0" />
                  <span>{tech}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-leaf-900/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs font-mono">
            &copy; {currentYear} LeafScan AI. Built for precision agriculture.
          </p>
          <div className="flex items-center gap-1.5 text-gray-600 text-xs font-mono">
            <span>Powered by</span>
            <span className="text-leaf-500">Attention</span>
            <span>&</span>
            <span className="text-leaf-500">Meta-Learning</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
