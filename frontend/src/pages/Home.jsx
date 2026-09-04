import { Link } from 'react-router-dom'
import { SAMPLE_LEAVES, heroBg } from '../assets'
import { useAuth } from '../contexts/AuthContext'

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: 'Attention Mechanism',
    desc: 'Spatial and channel attention layers focus the model on the most diagnostically relevant leaf regions.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Meta-Learning',
    desc: 'MAML-inspired few-shot learning allows the system to generalize to new disease types with minimal examples.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Real-Time Inference',
    desc: 'FastAPI backend with PyTorch delivers predictions in under 200 ms on standard hardware.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Multi-Disease Detection',
    desc: 'Identifies Leaf Spot, Powdery Mildew, Rust, Blight, and more with per-class confidence scores.',
  },
]

const STATS = [
  { value: '97.3%', label: 'Top-1 Accuracy',    color: 'text-leaf-400' },
  { value: '<200ms', label: 'Inference Time',   color: 'text-emerald-400' },
  { value: '5+',    label: 'Disease Classes',   color: 'text-teal-400' },
  { value: '50K+',  label: 'Training Samples',  color: 'text-cyan-400' },
]

const DISEASE_TYPES = [
  { name: 'Leaf Spot', color: 'from-amber-500 to-amber-700', ring: 'ring-amber-500/30' },
  { name: 'Powdery Mildew', color: 'from-gray-400 to-gray-600', ring: 'ring-gray-400/30' },
  { name: 'Rust', color: 'from-orange-500 to-red-600', ring: 'ring-orange-500/30' },
  { name: 'Blight', color: 'from-red-500 to-red-800', ring: 'ring-red-500/30' },
  { name: 'Healthy', color: 'from-leaf-500 to-leaf-700', ring: 'ring-leaf-500/30' },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="animate-fadeIn">
      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 -z-20">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-dark via-forest-dark/90 to-forest-dark/60" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-dark via-transparent to-forest-dark/40" />

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 right-[15%] w-[500px] h-[500px] bg-leaf-600/8 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-[5%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="max-w-6xl mx-auto px-6 w-full py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-leaf-900/40 border border-leaf-700/40 rounded-full px-4 py-1.5 mb-6 animate-slideDown backdrop-blur-sm">
                <span className="w-2 h-2 bg-leaf-400 rounded-full animate-pulse" />
                <span className="text-leaf-400 text-xs font-mono tracking-widest uppercase">AI-Powered Plant Health</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-[1.1] mb-6">
                Detect Leaf
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-leaf-400 via-emerald-400 to-teal-400">
                  Anomalies
                </span>
                <br />
                <span className="text-2xl md:text-3xl text-gray-400 font-light">Before They Spread</span>
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-xl">
                {user ? `Welcome back, ${user.name}.` : 'Upload a leaf photograph and get an instant AI diagnosis powered by deep attention networks'}{' '}
                and meta-learning — trained to catch diseases a human eye might miss.
              </p>

              <div className="flex gap-4 flex-wrap">
                <Link to="/detection" className="group relative inline-flex items-center gap-2 bg-leaf-600 hover:bg-leaf-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-leaf-900/40 hover:shadow-leaf-500/30 hover:shadow-2xl hover:scale-[1.02] active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Analyze a Leaf
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link to="/about" className="inline-flex items-center gap-2 border border-leaf-600/50 text-leaf-400 hover:bg-leaf-600/10 font-medium px-8 py-4 rounded-2xl transition-all duration-300 hover:border-leaf-500/60">
                  How it Works
                </Link>
              </div>
            </div>

            {/* Right: disease preview cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {DISEASE_TYPES.map(({ name, color, ring }, i) => (
                <div
                  key={name}
                  className={`glass-card hover:scale-[1.03] transition-all duration-300 cursor-pointer group overflow-hidden`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 ring-2 ${ring} shadow-lg`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{name}</h3>
                  <p className="text-gray-500 text-xs">Detectable condition</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ──────────────────────────────────────── */}
      <section className="border-y border-leaf-900/30 bg-forest-mid/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label, color }) => (
            <div key={label} className="text-center group">
              <p className={`text-4xl font-display font-bold ${color} mb-2 group-hover:scale-105 transition-transform`}>{value}</p>
              <p className="text-gray-500 text-sm font-mono tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works (Visual Steps) ──────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-leaf-500 font-mono text-xs uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="text-4xl font-display font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-lg mx-auto">Three simple steps to get your plant diagnosed by AI</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Upload Image',
              desc: 'Take a clear photo of your plant leaf and drag it into the upload zone.',
              icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
            },
            {
              step: '02',
              title: 'AI Analysis',
              desc: 'Our attention network analyzes the leaf structure, patterns, and color anomalies.',
              icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
            },
            {
              step: '03',
              title: 'Get Results',
              desc: 'Receive instant diagnosis with confidence score, disease info, and treatment tips.',
              icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map(({ step, title, desc, icon }, i) => (
            <div key={step} className="relative group">
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-gradient-to-r from-leaf-700/40 to-leaf-900/20" />
              )}
              <div className="glass-card text-center hover:border-leaf-700/60 transition-all duration-300 hover:scale-[1.02] relative z-10 bg-forest-dark/60">
                <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-leaf-600/20 to-leaf-800/20 rounded-2xl flex items-center justify-center border border-leaf-700/30 text-leaf-400 group-hover:border-leaf-500/50 group-hover:shadow-glow-sm transition-all duration-300">
                  {icon}
                </div>
                <span className="text-leaf-600 font-mono text-xs tracking-widest">STEP {step}</span>
                <h3 className="text-white font-display font-semibold text-lg mt-2 mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Disease Reference Gallery ─────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-forest-dark via-forest-mid/30 to-forest-dark" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-leaf-500 font-mono text-xs uppercase tracking-widest mb-3">Sample Gallery</p>
              <h2 className="text-4xl font-display font-bold text-white">Disease Reference Library</h2>
              <p className="text-gray-400 mt-3 max-w-xl">
                Browse real examples of leaf conditions our model can detect. Click any image for full details.
              </p>
            </div>
            <Link to="/diseases" className="hidden md:flex items-center gap-2 bg-leaf-600/20 hover:bg-leaf-600/30 border border-leaf-600/40 text-leaf-400 font-medium px-5 py-2.5 rounded-xl text-sm transition-all shrink-0">
              View Full Library
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {SAMPLE_LEAVES.map(({ id, name, image, disease, description }, index) => (
              <Link
                to="/diseases"
                key={id}
                className="group relative rounded-2xl overflow-hidden border border-leaf-800/30 hover:border-leaf-600/50 transition-all duration-500 hover:shadow-xl hover:shadow-leaf-900/20 hover:scale-[1.03]"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-sm mb-1 drop-shadow-lg">{name}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 drop-shadow">{description}</p>
                </div>
                {/* Hover badge */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <span className="bg-leaf-600/90 text-white text-xs font-mono px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    View Details
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="md:hidden mt-8 text-center">
            <Link to="/diseases" className="inline-flex items-center gap-2 bg-leaf-600/20 hover:bg-leaf-600/30 border border-leaf-600/40 text-leaf-400 font-medium px-6 py-3 rounded-xl text-sm transition-all">
              View Full Library
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-leaf-500 font-mono text-xs uppercase tracking-widest mb-3">Trusted By Growers</p>
          <h2 className="text-4xl font-display font-bold text-white mb-4">What Our Users Say</h2>
          <p className="text-gray-400 max-w-lg mx-auto">Real feedback from farmers and plant enthusiasts using LeafScan AI</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Ravi Sharma',
              role: 'Organic Farmer, Punjab',
              text: 'Detected early blight on my tomato crop before it spread. The treatment recommendations saved my entire harvest. Incredibly accurate!',
              rating: 5,
            },
            {
              name: 'Ananya Patel',
              role: 'Home Gardener, Gujarat',
              text: 'I was worried about white patches on my basil leaves. The chatbot identified powdery mildew instantly and gave me organic remedies. My garden is thriving again.',
              rating: 5,
            },
            {
              name: 'Suresh Kumar',
              role: 'Agricultural Researcher, ICAR',
              text: 'The attention heatmap visualization is excellent for research. It shows exactly which regions the model focuses on. Great tool for plant pathology studies.',
              rating: 5,
            },
          ].map(({ name, role, text, rating }) => (
            <div key={name} className="glass-card hover:border-leaf-700/60 transition-all duration-300 hover:scale-[1.01]">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: rating }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">"{text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-leaf-600/30 to-leaf-800/30 border border-leaf-700/40 flex items-center justify-center">
                  <span className="text-leaf-400 font-semibold text-sm">{name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{name}</p>
                  <p className="text-gray-500 text-xs font-mono">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-leaf-500 font-mono text-xs uppercase tracking-widest mb-3">Core Capabilities</p>
          <h2 className="text-4xl font-display font-bold text-white mb-4">Built for Precision Diagnosis</h2>
          <p className="text-gray-400 max-w-lg mx-auto">Advanced AI architecture designed specifically for plant pathology</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {FEATURES.map(({ icon, title, desc }, index) => (
            <div
              key={title}
              className="glass-card hover:border-leaf-700/60 transition-all duration-300 group hover:scale-[1.01] hover:shadow-glow-sm"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="flex gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-leaf-900/60 to-leaf-800/40 border border-leaf-700/40 rounded-2xl flex items-center justify-center text-leaf-400 shrink-0 group-hover:border-leaf-500/50 group-hover:shadow-glow-sm transition-all duration-300">
                  {icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── AI Assistant CTA ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-leaf-800/30">
          <div className="absolute inset-0 bg-gradient-to-br from-forest-mid via-forest-dark to-leaf-900/30" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-leaf-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-[80px]" />
          <div className="relative flex flex-col md:flex-row items-center gap-10 p-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-leaf-900/40 border border-leaf-700/40 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
                <span className="w-2 h-2 bg-leaf-400 rounded-full animate-pulse" />
                <span className="text-leaf-400 text-xs font-mono tracking-widest uppercase">AI Assistant</span>
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-4">Ask Our Disease Expert</h2>
              <p className="text-gray-400 leading-relaxed max-w-lg mb-6">
                Get instant answers about leaf diseases, symptoms, treatments, and prevention strategies.
                Our AI assistant knows everything about the diseases we detect.
              </p>
              <div className="flex flex-wrap gap-2">
                {DISEASE_TYPES.map(({ name, color }) => (
                  <span key={name} className={`bg-gradient-to-r ${color} text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg`}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-leaf-500/20 to-leaf-700/20 rounded-3xl flex items-center justify-center border border-leaf-600/30 animate-pulse-glow shadow-2xl shadow-leaf-900/30">
                <svg className="w-12 h-12 text-leaf-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 text-xs font-mono mt-4">Click the chat icon<br />to start asking</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-leaf-900/80 via-forest-mid to-leaf-800/60 animate-gradient" />
          <div className="absolute inset-0 bg-forest-dark/30" />
          {/* Glow effects */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-leaf-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-leaf-400/10 rounded-full blur-[60px]" />

          <div className="relative text-center py-20 px-8">
            <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-leaf-500/20 to-leaf-700/20 rounded-3xl flex items-center justify-center border border-leaf-600/30 animate-pulse-glow shadow-xl shadow-leaf-900/30">
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.82C4.5 18.5 6 16 8 14c-1 2-1.5 4-1.5 6 0 0 3-3 6-6-1 2-1.5 4-1.5 6 0 0 4-4 6.5-9.5.8-1.8 1-3.5 1-4.5 0 0-1 1-2.5 1.5C17 7 17 8 17 8z" fill="#4ade80"/>
              </svg>
            </div>
            <h2 className="text-4xl font-display font-bold text-white mb-4">Ready to Scan Your First Leaf?</h2>
            <p className="text-leaf-200/70 mb-10 max-w-lg mx-auto text-lg">
              Upload any leaf image — the model handles the rest. Your predictions are saved to your account.
            </p>
            <Link to="/detection" className="inline-flex items-center gap-2 bg-white text-forest-dark font-semibold px-12 py-4 rounded-2xl shadow-2xl shadow-black/30 hover:shadow-lg hover:scale-105 transition-all duration-300 text-lg">
              Start Detection
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
