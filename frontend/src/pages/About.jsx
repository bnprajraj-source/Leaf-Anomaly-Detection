const TECH_STACK = [
  { category: 'Frontend',    items: ['React 18', 'Vite', 'Tailwind CSS', 'Axios', 'React Router'] },
  { category: 'Backend',     items: ['Python 3.10+', 'FastAPI', 'Uvicorn', 'Pillow', 'NumPy'] },
  { category: 'AI / ML',     items: ['PyTorch', 'Attention CNN', 'MAML Meta-Learning', 'torchvision'] },
  { category: 'DevOps',      items: ['Docker', 'Docker Compose', 'Git'] },
]

const PIPELINE_STEPS = [
  {
    title: 'Image Preprocessing',
    body:  'Each uploaded image is resized to 224×224 pixels, normalized using ImageNet statistics, and optionally augmented with random flips and color jitter to improve robustness.',
  },
  {
    title: 'Spatial & Channel Attention',
    body:  'A CBAM-style dual attention module computes channel-wise feature importance and spatial attention maps, guiding the network to focus on lesion regions rather than background noise.',
  },
  {
    title: 'Deep Feature Extraction',
    body:  'A ResNet-50 backbone (pretrained on ImageNet) extracts rich hierarchical features, which are refined by the attention weights before being passed to the classification head.',
  },
  {
    title: 'Meta-Learning Adaptation',
    body:  'MAML (Model-Agnostic Meta-Learning) trains the model to adapt quickly to new disease classes from just a few examples, simulating few-shot generalization in deployment.',
  },
  {
    title: 'Prediction & Confidence',
    body:  'Softmax activations produce per-class probabilities. The top class and its confidence score are returned alongside the attention map flag for downstream visualization.',
  },
]

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fadeIn">
      {/* Header */}
      <div className="mb-14">
        <p className="text-leaf-500 font-mono text-xs uppercase tracking-widest mb-3">System Overview</p>
        <h1 className="text-4xl font-display font-bold text-white mb-4">
          How LeafScan Works
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
          LeafScan combines convolutional attention networks with meta-learning to deliver accurate, explainable plant disease diagnosis — even on rare or unseen conditions.
        </p>
      </div>

      {/* Pipeline */}
      <section className="mb-16">
        <h2 className="text-xl font-display font-semibold text-white mb-8">Detection Pipeline</h2>
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-leaf-900/60" />
          <div className="space-y-8">
            {PIPELINE_STEPS.map(({ title, body }, i) => (
              <div key={title} className="flex gap-6 relative">
                <div className="w-10 h-10 bg-forest-mid border border-leaf-700/50 rounded-full flex items-center justify-center shrink-0 z-10">
                  <span className="text-leaf-400 font-mono text-xs font-bold">0{i + 1}</span>
                </div>
                <div className="card flex-1 pt-3 pb-4">
                  <h3 className="text-white font-semibold mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="mb-16">
        <h2 className="text-xl font-display font-semibold text-white mb-8">Technology Stack</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {TECH_STACK.map(({ category, items }) => (
            <div key={category} className="card">
              <p className="text-xs font-mono text-leaf-500 uppercase tracking-widest mb-3">{category}</p>
              <div className="flex flex-wrap gap-2">
                {items.map(item => (
                  <span key={item} className="bg-forest-dark text-gray-300 text-xs font-mono px-2.5 py-1 rounded-lg border border-leaf-900/40">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Model details */}
      <section className="card">
        <h2 className="text-xl font-display font-semibold text-white mb-6">Model Architecture</h2>
        <div className="font-mono text-sm bg-forest-dark rounded-xl p-5 overflow-x-auto">
          <pre className="text-gray-400 leading-loose">{`LeafAnomalyModel(
  ├─ backbone:     ResNet50 (pretrained, ImageNet)
  ├─ attention:    CBAM
  │    ├─ channel: ChannelAttention(ratio=16)
  │    └─ spatial: SpatialAttention(kernel=7)
  ├─ meta:         MAMLWrapper
  │    ├─ inner_lr: 0.01
  │    └─ steps:   5
  └─ classifier:  Linear(2048 → num_classes)
)`}</pre>
        </div>
        <p className="text-gray-500 text-xs mt-4 font-mono">
          Input: 3 × 224 × 224  ·  Output: softmax probability vector over disease classes
        </p>
      </section>
    </div>
  )
}
