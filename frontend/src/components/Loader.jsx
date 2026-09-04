export default function Loader({ message = 'Analyzing leaf...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 animate-fadeIn">
      {/* Scanning animation */}
      <div className="relative w-28 h-28">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-leaf-700/30" />
        <div className="absolute inset-0 rounded-full border-t-2 border-leaf-400 animate-spin" />
        {/* Middle ring */}
        <div className="absolute inset-3 rounded-full border border-leaf-600/20" />
        <div className="absolute inset-3 rounded-full border-b border-leaf-500/50 animate-spin" style={{ animationDuration: '3s' }} />
        {/* Inner ring */}
        <div className="absolute inset-6 rounded-full border border-leaf-800/30" />
        <div className="absolute inset-6 rounded-full border-r border-leaf-400/30 animate-spin" style={{ animationDuration: '1.5s' }} />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.82C4.5 18.5 6 16 8 14c-1 2-1.5 4-1.5 6 0 0 3-3 6-6-1 2-1.5 4-1.5 6 0 0 4-4 6.5-9.5.8-1.8 1-3.5 1-4.5 0 0-1 1-2.5 1.5C17 7 17 8 17 8z" fill="#4ade80" className="animate-pulse-slow"/>
          </svg>
        </div>
        {/* Scanning line */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="scan-line" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-leaf-400 font-medium text-lg">{message}</p>
        <p className="text-gray-500 text-sm font-mono">Running attention mechanism...</p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-4">
        {['Preprocessing', 'Attention', 'Meta-Learning', 'Inference'].map((step, i) => (
          <div key={step} className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <div
                className="w-3 h-3 rounded-full bg-leaf-500/30 animate-pulse-slow"
                style={{ animationDelay: `${i * 0.4}s` }}
              />
              <div
                className="absolute inset-0 w-3 h-3 rounded-full bg-leaf-400 animate-ping"
                style={{ animationDelay: `${i * 0.4}s`, animationDuration: '2s' }}
              />
            </div>
            <span className="text-[10px] text-gray-600 font-mono">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
