import { useState, useEffect } from 'react'
import { Plus, Trash2, Zap, Pencil, X } from 'lucide-react'
import { getData, setData, generateId } from '../lib/storage'
import { formatCurrency, getWeekEndings, formatWeekEnding } from '../lib/forecastEngine'

export default function OneTimeExpenses() {
  const [items, setItems] = useState(() => getData('onetime_expenses', []))
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ description: '', amount: '', weekDate: '', weeks: '1', notes: '' })

  useEffect(() => { setData('onetime_expenses', items) }, [items])

  const weekEndings = getWeekEndings(new Date(), 52)

  const handleSave = () => {
    const amount = parseFloat(form.amount) || 0
    const weeks = parseInt(form.weeks) || 1
    if (!form.description || !amount || !form.weekDate) return

    const item = {
      id: editId || generateId(),
      description: form.description,
      amount,
      weekDate: form.weekDate,
      weeks,
      notes: form.notes,
    }

    if (editId) {
      setItems(items.map(i => i.id === editId ? item : i))
    } else {
      setItems([...items, item])
    }
    setForm({ description: '', amount: '', weekDate: '', weeks: '1', notes: '' })
    setShowForm(false)
    setEditId(null)
  }

  const handleEdit = (item) => {
    setForm({ description: item.description, amount: item.amount, weekDate: item.weekDate, weeks: item.weeks || 1, notes: item.notes || '' })
    setEditId(item.id)
    setShowForm(true)
  }

  const handleDelete = (id) => setItems(items.filter(i => i.id !== id))
  const totalOneTime = items.reduce((s, i) => s + (i.amount * (i.weeks || 1)), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Zap size={24} /> One-Time Expenses</h1>
          <p className="text-[#94a3b8] mt-1">Budget for planned purchases, repairs, and non-recurring costs</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ description: '', amount: '', weekDate: '', weeks: '1', notes: '' }) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb]">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Total One-Time Expenses</p>
          <p className="text-2xl font-bold text-[#ef4444] mt-1">{formatCurrency(totalOneTime)}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Active Items</p>
          <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">{editId ? 'Edit' : 'Add'} One-Time Expense</h3>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-[#64748b] hover:text-white"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-[#64748b] mb-1">Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="e.g., New truck for foreman" className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Amount per Week</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="2500" className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1"># of Weeks</label>
              <input type="number" value={form.weeks} onChange={e => setForm({ ...form, weeks: e.target.value })}
                min="1" className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Starting Week</label>
              <select value={form.weekDate} onChange={e => setForm({ ...form, weekDate: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm">
                <option value="">Select week...</option>
                {weekEndings.map(w => <option key={w.toISOString()} value={w.toISOString()}>{formatWeekEnding(w)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes" className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleSave} className="px-6 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb]">
              {editId ? 'Update' : 'Add'} Expense
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-4 py-3">Description</th>
              <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3">$/Week</th>
              <th className="text-center text-xs font-medium text-[#64748b] uppercase px-4 py-3">Weeks</th>
              <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3">Total</th>
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-4 py-3">Starting</th>
              <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="6" className="text-center text-[#64748b] py-8 text-sm">No one-time expenses. Click "Add Expense" to budget for planned purchases.</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="border-b border-[#334155]/30 hover:bg-[#334155]/20">
                <td className="px-4 py-3 text-white text-sm">{item.description}</td>
                <td className="px-4 py-3 text-right text-[#ef4444] font-mono text-sm">{formatCurrency(item.amount)}</td>
                <td className="px-4 py-3 text-center text-[#94a3b8] text-sm">{item.weeks || 1}</td>
                <td className="px-4 py-3 text-right text-[#ef4444] font-mono text-sm font-bold">{formatCurrency(item.amount * (item.weeks || 1))}</td>
                <td className="px-4 py-3 text-[#94a3b8] text-sm">{item.weekDate ? formatWeekEnding(new Date(item.weekDate)) : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(item)} className="text-[#94a3b8] hover:text-white mr-2"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-[#94a3b8] hover:text-[#ef4444]"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
