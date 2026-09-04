import { useState, useRef, useCallback } from 'react'

export default function UploadImage({ onImageSelect, disabled }) {
  const [preview,  setPreview]  = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onImageSelect(file)
  }, [onImageSelect])

  const handleChange = (e) => processFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true)  }
  const handleDragLeave = ()    => setDragging(false)

  const clearImage = () => {
    setPreview(null)
    onImageSelect(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => !disabled && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-4 pointer-events-none">
            <div className="w-20 h-20 bg-leaf-900/40 rounded-2xl flex items-center justify-center border border-leaf-700/30 animate-float-slow">
              <svg className="w-10 h-10 text-leaf-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-medium mb-1">Drop a leaf image here</p>
              <p className="text-gray-500 text-sm">or <span className="text-leaf-400 underline underline-offset-2">browse files</span></p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {['JPG', 'PNG', 'WEBP', 'BMP'].map(fmt => (
                <span key={fmt} className="text-xs font-mono bg-forest-light/30 text-gray-500 px-2.5 py-1 rounded-lg border border-leaf-900/20">{fmt}</span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-leaf-700/40 group">
          <img src={preview} alt="Leaf preview" className="w-full max-h-80 object-contain bg-forest-dark" />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
            <div className="flex gap-3">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="bg-forest-mid/80 backdrop-blur-sm border border-leaf-700/40 text-white hover:bg-leaf-800/60 font-medium px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Change
              </button>
              <button
                onClick={clearImage}
                disabled={disabled}
                className="bg-red-600/80 backdrop-blur-sm text-white hover:bg-red-500 font-medium px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove
              </button>
            </div>
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
          <div className="absolute top-3 left-3">
            <span className="badge-healthy text-xs flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Image loaded
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-forest-dark/60 backdrop-blur-sm text-gray-300 text-xs font-mono px-2 py-1 rounded-lg">
              {preview && 'Ready'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
