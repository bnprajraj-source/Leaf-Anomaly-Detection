import { useState, useEffect } from 'react'
import { getExpenses, logExpense, getExpenseSummary, getBudgetOverview } from '../services/api'
import { useToast } from '../components/Toast'

export default function Expenses() {
  const { showToast } = useToast()
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const [form, setForm] = useState({ amount: '', category: 'seeds', description: '', payment_method: 'cash', date: '' })
  const [tab, setTab] = useState('list')

  const categories = [
    { value: 'seeds', label: 'Seeds', emoji: '🫘' },
    { value: 'fertilizer', label: 'Fertilizer', emoji: '🧪' },
    { value: 'pesticide', label: 'Pesticide', emoji: '🧴' },
    { value: 'tools', label: 'Tools', emoji: '🔧' },
    { value: 'soil', label: 'Soil & Amendments', emoji: '🌍' },
    { value: 'water', label: 'Water', emoji: '💧' },
    { value: 'labor', label: 'Labor', emoji: '👷' },
    { value: 'equipment', label: 'Equipment', emoji: '⚙️' },
    { value: 'other', label: 'Other', emoji: '📦' },
  ]

  const load = async () => {
    try {
      setLoading(true)
      const [e, s, b] = await Promise.all([
        getExpenses({ per_page: 100 }),
        getExpenseSummary(),
        getBudgetOverview(),
      ])
      setExpenses(e.items || [])
      setSummary(s)
      setBudget(b)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleLog = async (e) => {
    e.preventDefault()
    if (!form.amount) return showToast('Amount required', 'error')
    try {
      await logExpense({
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description || undefined,
        payment_method: form.payment_method,
        date: form.date || undefined,
      })
      showToast('Expense logged!', 'success')
      setShowLog(false)
      setForm({ amount: '', category: 'seeds', description: '', payment_method: 'cash', date: '' })
      load()
    } catch (e) { showToast(e.message, 'error') }
  }

  const catEmoji = (c) => categories.find(x => x.value === c)?.emoji || '📦'

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-red-700">Expenses & Costs</h1>
        <button onClick={() => setShowLog(!showLog)} className="bg-red-600 text-white px-4 py-2 rounded-lg">+ Log Expense</button>
      </div>

      <div className="flex gap-2 mb-6">
        {['list', 'summary', 'budget'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {showLog && (
        <form onSubmit={handleLog} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="number" step="0.01" placeholder="Amount ($) *" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="border rounded-lg p-2" />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border rounded-lg p-2">
            {categories.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
          <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border rounded-lg p-2" />
          <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="border rounded-lg p-2">
            <option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option><option value="check">Check</option><option value="digital">Digital</option>
          </select>
          <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded-lg p-2" />
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg">Save</button>
            <button type="button" onClick={() => setShowLog(false)} className="bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <>
          {tab === 'list' && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {expenses.length === 0 ? <p className="p-6 text-center text-gray-400">No expenses logged yet</p> : (
                <table className="w-full">
                  <thead className="bg-gray-50"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Description</th><th className="p-3 text-right">Amount</th></tr></thead>
                  <tbody>{expenses.map(exp => (
                    <tr key={exp.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-sm">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="p-3">{catEmoji(exp.category)} {exp.category}</td>
                      <td className="p-3 text-sm text-gray-600">{exp.description || '-'}</td>
                      <td className="p-3 text-right font-bold text-red-600">${exp.amount.toFixed(2)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'summary' && summary && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
              <div className="space-y-3">{(summary.by_category || []).map(c => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-lg">{catEmoji(c.category)}</span>
                  <span className="font-medium w-32">{c.category}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4"><div className="bg-red-400 h-4 rounded-full" style={{ width: `${summary.total > 0 ? (c.total / summary.total * 100) : 0}%` }}></div></div>
                  <span className="font-bold text-red-600 w-20 text-right">${c.total.toFixed(2)}</span>
                </div>
              ))}</div>
              <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg"><span>Total</span><span className="text-red-600">${summary.total?.toFixed(2) || 0}</span></div>
            </div>
          )}

          {tab === 'budget' && budget && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <div className="text-sm text-gray-500">Monthly Budget</div>
                <div className="text-3xl font-bold text-gray-800 mt-1">${budget.monthly_budget?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <div className="text-sm text-gray-500">Spent This Month</div>
                <div className="text-3xl font-bold text-red-600 mt-1">${budget.total_spent?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <div className="text-sm text-gray-500">Remaining</div>
                <div className={`text-3xl font-bold mt-1 ${(budget.remaining || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>${budget.remaining?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <div className="text-sm text-gray-500">Budget Used</div>
                <div className="text-3xl font-bold text-purple-600 mt-1">{budget.budget_used_percent?.toFixed(0) || 0}%</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
