import { useState, useEffect } from 'react'
import { getImportTemplate, validateImportCSV, importPlantsFromCSV, getPlants } from '../services/api'
import { useToast } from '../components/Toast'

export default function ImportPlants() {
  const { showToast } = useToast()
  const [file, setFile] = useState(null)
  const [validating, setValidating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [validation, setValidation] = useState(null)
  const [result, setResult] = useState(null)

  const handleDownloadTemplate = async () => {
    try {
      const blob = await getImportTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'plant_import_template.csv'
      a.click()
      window.URL.revokeObjectURL(url)
      showToast('Template downloaded!', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  const handleValidate = async () => {
    if (!file) return showToast('Select a CSV file first', 'error')
    try {
      setValidating(true)
      const data = await validateImportCSV(file)
      setValidation(data)
      if (data.valid) showToast(`${data.valid_rows} rows valid, ready to import!`, 'success')
      else showToast(`${data.errors?.length || 0} errors found`, 'error')
    } catch (e) { showToast(e.message, 'error') }
    finally { setValidating(false) }
  }

  const handleImport = async () => {
    if (!file || !validation?.valid) return
    try {
      setImporting(true)
      const data = await importPlantsFromCSV(file, false)
      setResult(data)
      showToast(`Imported ${data.imported_count} plants!`, 'success')
    } catch (e) { showToast(e.message, 'error') }
    finally { setImporting(false) }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-teal-700 mb-6">Import Plants from CSV</h1>

      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Step 1: Get Template</h2>
          <button onClick={handleDownloadTemplate} className="bg-teal-100 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-200">Download CSV Template</button>
        </div>
        <p className="text-sm text-gray-500">Download the template, fill in your plant data, then upload below.</p>
        <p className="text-xs text-gray-400 mt-2">Required columns: name. Optional: species, location, notes, tags</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Step 2: Upload CSV</h2>
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} className="border rounded-lg p-2 w-full mb-4" />
        {file && <p className="text-sm text-gray-600">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
      </div>

      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Step 3: Validate & Import</h2>
        <div className="flex gap-3 mb-4">
          <button onClick={handleValidate} disabled={!file || validating} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
            {validating ? 'Validating...' : 'Validate'}
          </button>
          <button onClick={handleImport} disabled={!validation?.valid || importing} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
            {importing ? 'Importing...' : 'Import Plants'}
          </button>
        </div>

        {validation && (
          <div className={`p-4 rounded-lg mb-4 ${validation.valid ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={`font-medium ${validation.valid ? 'text-green-700' : 'text-red-700'}`}>
              {validation.valid ? `${validation.valid_rows} valid rows` : `${validation.errors?.length || 0} errors`}
            </p>
            {validation.errors && validation.errors.length > 0 && (
              <ul className="mt-2 text-sm text-red-600 space-y-1">
                {validation.errors.slice(0, 10).map((e, i) => <li key={i}>Row {e.row}: {e.error}</li>)}
                {validation.errors.length > 10 && <li>...and {validation.errors.length - 10} more</li>}
              </ul>
            )}
          </div>
        )}

        {result && (
          <div className="p-4 rounded-lg bg-green-50">
            <p className="font-medium text-green-700">Import complete!</p>
            <p className="text-sm text-green-600">Imported {result.imported_count} plants. {result.skipped_count} skipped.</p>
          </div>
        )}
      </div>
    </div>
  )
}
