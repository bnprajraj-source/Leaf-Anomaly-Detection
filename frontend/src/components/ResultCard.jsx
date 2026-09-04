import { useEffect, useState } from 'react'
import DISEASES from '../data/diseases'

const DISEASE_MAP = {
  'Healthy':        'healthy',
  'Leaf Spot':      'leaf-spot',
  'Powdery Mildew': 'powdery-mildew',
  'Rust':           'rust',
  'Blight':         'blight',
}

const DISEASE_ICONS = {
  'Healthy':        '🟢',
  'Leaf Spot':      '🟤',
  'Powdery Mildew': '⬜',
  'Rust':           '🟠',
  'Blight':         '⬛',
}

const DISEASE_COLORS = {
  'Healthy':        'leaf',
  'Leaf Spot':      'amber',
  'Powdery Mildew': 'gray',
  'Rust':           'orange',
  'Blight':         'red',
}

function ConfidenceBar({ value, color }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100)
    return () => clearTimeout(t)
  }, [value])
  return (
    <div className="confidence-bar">
      <div className="confidence-fill" style={{ width: `${width}%`, background: color }} />
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
        active
          ? 'bg-leaf-600/30 text-leaf-300 border border-leaf-600/40'
          : 'text-gray-500 hover:text-gray-300 hover:bg-forest-mid/60 border border-transparent'
      }`}
    >
      {children}
    </button>
  )
}

function InfoSection({ title, items, lang }) {
  if (!items || items.length === 0) return null
  return (
    <div className="mb-4">
      <h4 className="text-xs font-mono text-leaf-400 uppercase tracking-widest mb-2">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
            <span className="text-leaf-500 mt-0.5 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function HealthyDetail({ lang }) {
  const h = DISEASES.find(d => d.id === 'healthy')
  return (
    <div className="space-y-4">
      <div className="bg-leaf-900/20 border border-leaf-700/30 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-leaf-300 mb-2">
          {lang === 'hi' ? '🟢 स्वस्थ पत्ता' : '🟢 Healthy Leaf'}
        </h4>
        <p className="text-gray-400 text-sm leading-relaxed">
          {lang === 'hi' ? h.descriptionHi : h.description}
        </p>
      </div>
      <InfoSection
        title={lang === 'hi' ? 'लक्षण' : 'Characteristics'}
        items={lang === 'hi' ? h.symptomsHi : h.symptoms}
        lang={lang}
      />
      <InfoSection
        title={lang === 'hi' ? 'देखभाल के तरीके' : 'Care Tips'}
        items={lang === 'hi' ? h.treatmentHi : h.treatment}
        lang={lang}
      />
      <InfoSection
        title={lang === 'hi' ? 'रोकथाम' : 'Prevention'}
        items={lang === 'hi' ? h.preventionHi : h.prevention}
        lang={lang}
      />
    </div>
  )
}

function DiseaseDetail({ disease, lang }) {
  const [activeTab, setActiveTab] = useState('overview')
  const d = DISEASES.find(d => d.id === disease)
  if (!d) return null

  const tabs = {
    en: ['overview', 'symptoms', 'causes', 'treatment', 'precautions', 'crops', 'faq'],
    hi: ['अवलोकन', 'लक्षण', 'कारण', 'उपचार', 'सावधानी', 'फसलें', 'सवाल-जवाब'],
  }
  const tabKeys = ['overview', 'symptoms', 'causes', 'treatment', 'precautions', 'crops', 'faq']

  const severityBgClass = {
    'None': 'bg-leaf-900/20 border border-leaf-700/30',
    'Moderate': 'bg-amber-900/20 border border-amber-700/30',
    'Moderate to Severe': 'bg-orange-900/20 border border-orange-700/30',
    'Severe': 'bg-red-900/20 border border-red-700/30',
  }

  return (
    <div className="space-y-4">
      {/* Disease Header */}
      <div className={`${severityBgClass[d.severity] || severityBgClass['None']} rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{d.icon}</span>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {lang === 'hi' ? d.nameHi : d.name}
              </h4>
              <p className="text-xs text-gray-500 font-mono">
                {lang === 'hi' ? d.categoryHi : d.category}
              </p>
            </div>
          </div>
          <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${
            d.severity === 'Severe' ? 'bg-red-600/20 text-red-400 border-red-600/30' :
            d.severity === 'Moderate to Severe' ? 'bg-orange-600/20 text-orange-400 border-orange-600/30' :
            'bg-amber-600/20 text-amber-400 border-amber-600/30'
          }`}>
            {lang === 'hi' ? d.severityHi : d.severity}
          </span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          {lang === 'hi' ? d.descriptionHi : d.description}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabKeys.map((key, i) => (
          <TabButton key={key} active={activeTab === key} onClick={() => setActiveTab(key)}>
            {tabs[lang][i]}
          </TabButton>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-forest-dark/40 rounded-xl p-4 border border-leaf-900/20 min-h-[180px]">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-leaf-900/40 rounded-xl flex items-center justify-center border border-leaf-700/30">
                <span className="text-xl">{d.icon}</span>
              </div>
              <div>
                <p className="text-white font-medium">{lang === 'hi' ? d.nameHi : d.name}</p>
                <p className="text-xs text-gray-500 font-mono">{lang === 'hi' ? d.categoryHi : d.category}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{lang === 'hi' ? d.descriptionHi : d.description}</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-forest-dark/60 rounded-lg p-3 border border-leaf-900/20">
                <p className="text-[10px] text-gray-600 font-mono uppercase mb-1">{lang === 'hi' ? 'गंभीरता' : 'Severity'}</p>
                <p className={`text-sm font-semibold ${d.severity === 'Severe' ? 'text-red-400' : d.severity === 'Moderate to Severe' ? 'text-orange-400' : 'text-amber-400'}`}>
                  {lang === 'hi' ? d.severityHi : d.severity}
                </p>
              </div>
              <div className="bg-forest-dark/60 rounded-lg p-3 border border-leaf-900/20">
                <p className="text-[10px] text-gray-600 font-mono uppercase mb-1">{lang === 'hi' ? 'श्रेणी' : 'Category'}</p>
                <p className="text-sm font-semibold text-gray-300">{lang === 'hi' ? d.categoryHi : d.category}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'symptoms' && (
          <InfoSection title={lang === 'hi' ? 'लक्षण' : 'Symptoms'} items={lang === 'hi' ? d.symptomsHi : d.symptoms} lang={lang} />
        )}

        {activeTab === 'causes' && (
          <InfoSection title={lang === 'hi' ? 'कारण' : 'Causes'} items={lang === 'hi' ? d.causesHi : d.causes} lang={lang} />
        )}

        {activeTab === 'treatment' && (
          <div className="space-y-4">
            <InfoSection title={lang === 'hi' ? 'दवाएं और उपचार' : 'Medicines & Treatment'} items={lang === 'hi' ? d.treatmentHi : d.treatment} lang={lang} />
            <div className="bg-leaf-900/20 border border-leaf-700/30 rounded-lg p-3">
              <p className="text-xs text-leaf-400 font-mono mb-1">
                {lang === 'hi' ? 'अनुकूल परिस्थितियां' : 'Favorable Conditions'}
              </p>
              <p className="text-gray-400 text-sm">{lang === 'hi' ? d.favorableConditionsHi : d.favorableConditions}</p>
            </div>
          </div>
        )}

        {activeTab === 'precautions' && (
          <InfoSection title={lang === 'hi' ? 'रोकथाम और सावधानी' : 'Precautions & Prevention'} items={lang === 'hi' ? d.preventionHi : d.prevention} lang={lang} />
        )}

        {activeTab === 'crops' && (
          <InfoSection title={lang === 'hi' ? 'प्रभावित फसलें' : 'Affected Crops'} items={lang === 'hi' ? d.affectedCropsHi : d.affectedCrops} lang={lang} />
        )}

        {activeTab === 'faq' && (
          <div className="space-y-3">
            {(lang === 'hi' ? d.faqHi : d.faq).map((faq, i) => (
              <div key={i} className="bg-forest-dark/60 rounded-lg p-3 border border-leaf-900/20">
                <p className="text-white text-sm font-medium mb-1.5">
                  {lang === 'hi' ? 'प्र:' : 'Q:'} {faq.q}
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {lang === 'hi' ? 'उ:' : 'A:'} {faq.a}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResultCard({ result, lang = 'en' }) {
  const isHealthy = result.prediction === 'Healthy'
  const barColor = isHealthy ? '#22c55e' : result.confidence > 80 ? '#ef4444' : '#f59e0b'
  const diseaseId = DISEASE_MAP[result.anomaly_type]

  const labels = {
    en: {
      analysisResult: 'Analysis Result',
      noDisease: 'No Disease',
      diseaseFound: 'Disease Found',
      modelConfidence: 'Model Confidence',
      detectedCondition: 'Detected Condition',
      deepAnalysis: 'Deep Analysis',
      architecture: 'Architecture',
      approach: 'Approach',
      inputSize: 'Input Size',
      framework: 'Framework',
      attentionNote: 'Attention map is available. The model highlighted key regions influencing this prediction.',
      savedToDb: 'Saved to MongoDB',
    },
    hi: {
      analysisResult: 'विश्लेषण परिणाम',
      noDisease: 'रोग नहीं',
      diseaseFound: 'रोग मिला',
      modelConfidence: 'मॉडल विश्वास स्तर',
      detectedCondition: 'पहचानी गई स्थिति',
      deepAnalysis: 'गहन विश्लेषण',
      architecture: 'वास्तुकला',
      approach: 'दृष्टिकोण',
      inputSize: 'इनपुट आकार',
      framework: 'फ्रेमवर्क',
      attentionNote: 'ध्यान मानचित्र उपलब्ध है। मॉडल ने इस भविष्यवाणी को प्रभावित करने वाले प्रमुख क्षेत्रों को उजागर किया है।',
      savedToDb: 'MongoDB में सहेजा गया',
    },
  }
  const l = labels[lang] || labels.en

  return (
    <div className="glass-card border-glow-green animate-slideUp">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">{l.analysisResult}</p>
          <h3 className={`text-2xl font-display font-semibold ${isHealthy ? 'text-leaf-400' : 'text-red-400'}`}>
            {result.prediction}
          </h3>
        </div>
        <span className={isHealthy ? 'badge-healthy' : 'badge-diseased'}>
          {isHealthy ? `✓ ${l.noDisease}` : `⚠ ${l.diseaseFound}`}
        </span>
      </div>

      {/* Confidence */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400 font-medium">{l.modelConfidence}</span>
          <span className="font-mono font-semibold text-white">{result.confidence}%</span>
        </div>
        <ConfidenceBar value={result.confidence} color={barColor} />
        <p className="text-xs text-gray-600 font-mono">
          {result.confidence >= 90
            ? (lang === 'hi' ? 'उच्च विश्वास स्तर' : 'High confidence prediction')
            : result.confidence >= 70
            ? (lang === 'hi' ? 'मध्यम विश्वास — मैनुअल समीक्षा की सलाह' : 'Moderate confidence — consider manual review')
            : (lang === 'hi' ? 'कम विश्वास — विशेषज्ञ समीक्षा की सिफारिश' : 'Low confidence — manual expert review recommended')}
        </p>
      </div>

      {/* Anomaly type */}
      <div className="bg-forest-dark/60 rounded-xl p-4 mb-4 border border-leaf-900/30">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{DISEASE_ICONS[result.anomaly_type] || '❓'}</span>
          <div>
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">{l.detectedCondition}</p>
            <p className="text-white font-semibold">{result.anomaly_type}</p>
          </div>
        </div>
      </div>

      {/* Deep Analysis */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-leaf-900/60 rounded-lg flex items-center justify-center">
            <span className="text-leaf-400 text-xs">◈</span>
          </div>
          <h3 className="text-sm font-mono text-leaf-400 uppercase tracking-widest">{l.deepAnalysis}</h3>
        </div>
        {isHealthy ? (
          <HealthyDetail lang={lang} />
        ) : diseaseId ? (
          <DiseaseDetail disease={diseaseId} lang={lang} />
        ) : (
          <p className="text-gray-500 text-sm">{lang === 'hi' ? 'इस रोग के लिए विस्तृत जानकारी उपलब्ध नहीं है।' : 'Detailed information not available for this condition.'}</p>
        )}
      </div>

      {/* Model details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: l.architecture, value: 'Attention CNN', icon: '🏗️' },
          { label: l.approach, value: 'Meta-Learning', icon: '🧠' },
          { label: l.inputSize, value: '224 × 224 px', icon: '📐' },
          { label: l.framework, value: 'PyTorch', icon: '🔥' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-forest-dark/40 rounded-lg px-3 py-2.5 border border-leaf-900/20">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">{icon}</span>
              <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-gray-300 text-sm font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Attention note */}
      {result.attention_map_available && (
        <div className="border border-leaf-800/40 rounded-xl p-3 flex gap-3 items-start bg-leaf-900/10 mb-3">
          <div className="w-6 h-6 bg-leaf-900/60 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-leaf-400 text-xs">◈</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{l.attentionNote}</p>
        </div>
      )}

      {/* Share / Download */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => {
            const d = DISEASES.find(dis => dis.id === diseaseId)
            const text = [
              `LeafScan AI - Detection Report`,
              `${'='.repeat(40)}`,
              `Prediction: ${result.prediction}`,
              `Disease: ${result.anomaly_type}`,
              `Confidence: ${result.confidence}%`,
              d ? `Severity: ${d.severity}` : '',
              d ? `Category: ${d.category}` : '',
              ``,
              `Description:`,
              d ? d.description : '',
              ``,
              `Symptoms:`,
              ...(d ? d.symptoms.map((s, i) => `  ${i+1}. ${s}`) : []),
              ``,
              `Treatment:`,
              ...(d ? d.treatment.map((t, i) => `  ${i+1}. ${t}`) : []),
              ``,
              `Prevention:`,
              ...(d ? d.prevention.map((p, i) => `  ${i+1}. ${p}`) : []),
              ``,
              `Generated by LeafScan AI on ${new Date().toLocaleDateString()}`,
            ].filter(Boolean).join('\n')
            const blob = new Blob([text], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `leafscan-report-${result.anomaly_type.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-forest-mid border border-leaf-900/40 text-gray-400 hover:text-leaf-400 hover:border-leaf-700/40 text-xs font-mono px-3 py-2.5 rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {lang === 'hi' ? 'डाउनलोड' : 'Download Report'}
        </button>
        <button
          onClick={() => {
            const shareData = {
              title: 'LeafScan AI Detection Result',
              text: `${result.anomaly_type} detected with ${result.confidence}% confidence. ${isHealthy ? 'Leaf is healthy!' : 'Disease treatment needed.'}`,
              url: window.location.href,
            }
            if (navigator.share) {
              navigator.share(shareData).catch(() => {})
            } else {
              navigator.clipboard.writeText(shareData.text).then(() => {
                alert(lang === 'hi' ? 'क्लिपबोर्ड पर कॉपी किया गया!' : 'Copied to clipboard!')
              })
            }
          }}
          className="flex items-center justify-center gap-2 bg-forest-mid border border-leaf-900/40 text-gray-400 hover:text-leaf-400 hover:border-leaf-700/40 text-xs font-mono px-3 py-2.5 rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {lang === 'hi' ? 'शेयर' : 'Share'}
        </button>
      </div>

      {/* MongoDB saved indicator */}
      {result.record_id && (
        <div className="border border-leaf-900/40 rounded-xl p-3 flex gap-3 items-start mt-3">
          <svg className="w-4 h-4 text-leaf-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
          </svg>
          <p className="text-xs text-gray-400 leading-relaxed">
            {l.savedToDb}
            <span className="text-gray-600 font-mono ml-1">({result.record_id.slice(0, 8)}...)</span>
          </p>
        </div>
      )}
    </div>
  )
}
