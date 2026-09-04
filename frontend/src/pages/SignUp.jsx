import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      await register(name, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const avatarSeed = name || 'newuser'

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 animate-fadeIn">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-forest-dark" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-leaf-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-leaf-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-leaf-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-leaf-900/50 group-hover:shadow-leaf-600/30 transition-shadow">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.82C4.5 18.5 6 16 8 14c-1 2-1.5 4-1.5 6 0 0 3-3 6-6-1 2-1.5 4-1.5 6 0 0 4-4 6.5-9.5.8-1.8 1-3.5 1-4.5 0 0-1 1-2.5 1.5C17 7 17 8 17 8z" fill="#4ade80"/>
                <path d="M12 22s0-4 2-8c-2 2-5 6-5 6" fill="#22c55e" opacity="0.7"/>
              </svg>
            </div>
            <div>
              <span className="font-display font-semibold text-white text-lg leading-none block">LeafScan</span>
              <span className="text-leaf-500 text-[10px] font-mono tracking-widest leading-none">ANOMALY DETECTION</span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden border-2 border-leaf-600/40 shadow-lg shadow-leaf-900/30 bg-gradient-to-br from-leaf-600/20 to-leaf-800/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.82C4.5 18.5 6 16 8 14c-1 2-1.5 4-1.5 6 0 0 3-3 6-6-1 2-1.5 4-1.5 6 0 0 4-4 6.5-9.5.8-1.8 1-3.5 1-4.5 0 0-1 1-2.5 1.5C17 7 17 8 17 8z" fill="#4ade80"/>
                <path d="M12 22s0-4 2-8c-2 2-5 6-5 6" fill="#22c55e" opacity="0.7"/>
              </svg>
            </div>
            <h1 className="text-2xl font-display font-bold text-white">Create Account</h1>
            <p className="text-gray-400 text-sm mt-1">Join LeafScan for AI-powered plant diagnosis</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-600/10 border border-red-600/30 rounded-xl px-4 py-3 text-red-400 text-sm animate-slideUp">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input-field"
                placeholder="Repeat your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-leaf-400 hover:text-leaf-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
