import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-forest-dark flex items-center justify-center px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-leaf-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-leaf-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg">
        {/* Animated 404 */}
        <div className="mb-8">
          <div className="relative inline-block">
            <span className="text-[120px] md:text-[160px] font-display font-bold text-leaf-600/10 leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-leaf-900/40 rounded-3xl flex items-center justify-center border border-leaf-700/30 animate-float-slow">
                <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14">
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.82C4.5 18.5 6 16 8 14c-1 2-1.5 4-1.5 6 0 0 3-3 6-6-1 2-1.5 4-1.5 6 0 0 4-4 6.5-9.5.8-1.8 1-3.5 1-4.5 0 0-1 1-2.5 1.5C17 7 17 8 17 8z" fill="#4ade80" fillOpacity="0.6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-400 text-lg mb-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <p className="text-gray-600 text-sm mb-8">
          Check the URL or navigate back to a known page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
          <Link
            to="/detection"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Analyze a Leaf
          </Link>
        </div>

        {/* Fun fact */}
        <div className="mt-12 bg-forest-mid/40 border border-leaf-900/30 rounded-xl p-4">
          <p className="text-leaf-400 text-xs font-mono mb-1">Did you know?</p>
          <p className="text-gray-400 text-sm">
            Our AI model can detect 5 different leaf conditions with over 97% accuracy using attention-based deep learning.
          </p>
        </div>
      </div>
    </div>
  )
}
