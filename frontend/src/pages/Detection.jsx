import { useState } from 'react'
import UploadImage  from '../components/UploadImage'
import ResultCard   from '../components/ResultCard'
import Loader       from '../components/Loader'
import { predictLeafAnomaly } from '../services/api'

const STATES = { IDLE: 'idle', LOADING: 'loading', RESULT: 'result', ERROR: 'error' }

export default function Detection() {
  const [imageFile, setImageFile] = useState(null)
  const [state,     setState]     = useState(STATES.IDLE)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState(null)
  const [lang,      setLang]      = useState('en')

  const handleImageSelect = (file) => {
    setImageFile(file)
    setState(STATES.IDLE)
    setResult(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!imageFile) return
    setState(STATES.LOADING)
    setError(null)
    try {
      const data = await predictLeafAnomaly(imageFile)
      setResult(data)
      setState(STATES.RESULT)
    } catch (err) {
      setError(err.message)
      setState(STATES.ERROR)
    }
  }

  const handleReset = () => {
    setImageFile(null)
    setResult(null)
    setError(null)
    setState(STATES.IDLE)
  }

  const t = {
    en: {
      title: 'Disease Detection',
      subtitle: 'Upload a clear, well-lit photograph of a leaf. The model works best with images taken in natural light against a contrasting background.',
      step1: '1 — Upload Image',
      runBtn: 'Run Anomaly Detection',
      clearBtn: 'Clear & Start Over',
      pipeline: 'Pipeline',
      readyTitle: 'Ready to Analyze',
      readyDesc: 'Upload a leaf image to begin detection',
      imageReady: 'Image Ready',
      imageReadyDesc: 'Click',
      imageReadyDesc2: 'to proceed',
      analyzing: 'Analyzing leaf structure...',
      errorTitle: 'Detection Failed',
      errorDesc: 'Make sure the backend server is running on port 8000.',
      retry: 'Retry',
    },
    hi: {
      title: 'रोग का पता लगाना',
      subtitle: 'पत्ते की एक स्पष्ट, अच्छी तरह से रोशनी वाली तस्वीर अपलोड करें। मॉडल प्राकृतिक प्रकाश में ली गई तस्वीरों के साथ सबसे अच्छा काम करता है।',
      step1: '1 — छवि अपलोड करें',
      runBtn: 'विसंगति का पता लगाएं',
      clearBtn: 'साफ करें और फिर से शुरू करें',
      pipeline: 'पाइपलाइन',
      readyTitle: 'विश्लेषण के लिए तैयार',
      readyDesc: 'पत्ते की छवि अपलोड करके पता लगाना शुरू करें',
      imageReady: 'छवि तैयार',
      imageReadyDesc: 'क्लिक करें',
      imageReadyDesc2: 'आगे बढ़ने के लिए',
      analyzing: 'पत्ते की संरचना का विश्लेषण हो रहा है...',
      errorTitle: 'पता लगाना विफल',
      errorDesc: 'सुनिश्चित करें कि बैकएंड सर्वर पोर्ट 8000 पर चल रहा है।',
      retry: 'पुनः प्रयास करें',
    },
  }

  const pipelineSteps = [
    { step: '01', en: 'Image Preprocessing',    hi: 'छवि पूर्व-प्रसंस्करण', desc_en: 'Resize, normalize, augment', desc_hi: 'आकार बदलें, सामान्य करें, बढ़ाएं', icon: '🖼️' },
    { step: '02', en: 'Attention Mechanism',    hi: 'ध्यान तंत्र', desc_en: 'Spatial & channel attention', desc_hi: 'स्थानिक और चैनल ध्यान', icon: '👁️' },
    { step: '03', en: 'Feature Extraction',     hi: 'विशेषता निष्कर्षण', desc_en: 'Deep CNN backbone', desc_hi: 'गहरी CNN बैकबोन', icon: '🧬' },
    { step: '04', en: 'Meta-Learning Module',   hi: 'मेटा-लर्निंग मॉड्यूल', desc_en: 'Few-shot class prediction', desc_hi: 'फ्यू-शॉट क्लास भविष्यवाणी', icon: '🧠' },
    { step: '05', en: 'Anomaly Classification', hi: 'विसंगति वर्गीकरण', desc_en: 'Softmax confidence scores', desc_hi: 'सॉफ्टमैक्स विश्वास स्कोर', icon: '📊' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-fadeIn">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="text-leaf-500 font-mono text-xs uppercase tracking-widest mb-2">
            {lang === 'hi' ? 'पत्ता विश्लेषण' : 'Leaf Analysis'}
          </p>
          <h1 className="text-4xl font-display font-bold text-white">{t[lang].title}</h1>
          <p className="text-gray-400 mt-2 max-w-xl">{t[lang].subtitle}</p>
        </div>
        {/* Language Toggle */}
        <button
          onClick={() => setLang(prev => prev === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-1.5 bg-leaf-800/40 hover:bg-leaf-700/50 border border-leaf-600/30 rounded-lg px-3 py-2 transition-all shrink-0 mt-2"
          title={lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
        >
          <svg className="w-4 h-4 text-leaf-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="text-xs font-mono text-leaf-300">{lang === 'en' ? 'EN' : 'HI'}</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left: upload */}
        <div className="space-y-6">
          <div className="glass-card">
            <h2 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-4">{t[lang].step1}</h2>
            <UploadImage onImageSelect={handleImageSelect} disabled={state === STATES.LOADING} />
          </div>

          {imageFile && state !== STATES.LOADING && (
            <div className="animate-slideUp">
              <button
                onClick={handleAnalyze}
                className="btn-primary w-full py-4 text-base animate-glow"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t[lang].runBtn}
                </span>
              </button>
              <button
                onClick={handleReset}
                className="btn-secondary w-full py-3 text-sm mt-3"
              >
                {t[lang].clearBtn}
              </button>
            </div>
          )}

          {/* Pipeline steps */}
          <div className="glass-card">
            <h2 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-4">{t[lang].pipeline}</h2>
            <ol className="space-y-3">
              {pipelineSteps.map(({ step, en, hi, desc_en, desc_hi, icon }) => (
                <li key={step} className="flex gap-3 items-start group">
                  <span className="text-xs font-mono text-leaf-600 mt-0.5 w-5 shrink-0">{step}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-base group-hover:scale-110 transition-transform">{icon}</span>
                    <div>
                      <p className="text-gray-300 text-sm font-medium">{lang === 'hi' ? hi : en}</p>
                      <p className="text-gray-600 text-xs">{lang === 'hi' ? desc_hi : desc_en}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: result area */}
        <div>
          {state === STATES.IDLE && !imageFile && (
            <div className="glass-card flex flex-col items-center justify-center py-20 text-center border-dashed">
              <div className="w-20 h-20 bg-forest-dark rounded-2xl flex items-center justify-center mb-4 animate-float-slow">
                <svg className="w-9 h-9 text-leaf-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <p className="text-gray-500 font-medium mb-1">{t[lang].readyTitle}</p>
              <p className="text-gray-600 text-sm">{t[lang].readyDesc}</p>
            </div>
          )}

          {state === STATES.IDLE && imageFile && (
            <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-leaf-900/40 rounded-2xl flex items-center justify-center mb-4 border border-leaf-700/40">
                <svg className="w-8 h-8 text-leaf-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-gray-300 font-medium mb-1">{t[lang].imageReady}</p>
              <p className="text-gray-500 text-sm">
                {t[lang].imageReadyDesc} <span className="text-leaf-400 font-medium">{t[lang].runBtn}</span> {t[lang].imageReadyDesc2}
              </p>
            </div>
          )}

          {state === STATES.LOADING && (
            <div className="glass-card">
              <Loader message={t[lang].analyzing} />
            </div>
          )}

          {state === STATES.RESULT && result && (
            <ResultCard result={result} lang={lang} />
          )}

          {state === STATES.ERROR && (
            <div className="glass-card border-red-800/40 animate-slideUp">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-red-400 text-xl">⚠</span>
                </div>
                <div>
                  <h3 className="text-red-400 font-semibold mb-1">{t[lang].errorTitle}</h3>
                  <p className="text-gray-400 text-sm mb-4">{error}</p>
                  <p className="text-gray-600 text-xs mb-4">{t[lang].errorDesc}</p>
                  <button onClick={handleAnalyze} className="btn-primary text-sm py-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {t[lang].retry}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
