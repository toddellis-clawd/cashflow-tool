import { useState, useEffect } from 'react'
import { Plus, Trash2, Repeat, DollarSign, Pencil, X, Check } from 'lucide-react'
import { getData, setData, generateId } from '../lib/storage'
import { formatCurrency } from '../lib/forecastEngine'

const FREQ_LABELS = { w: 'Weekly', b: 'Bi-weekly', m: 'Monthly' }

export default function RecurringExpenses() {
  const [expenses, setExpenses] = useState(() => getData('recurring', []))
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({
    name: '', frequency: 'w', day: '', amount: '', isPayroll: false, startDate: '', active: true
  })

  useEffect(() => { setData('recurring', expenses) }, [expenses])

  const resetForm = () => {
    setForm({ name: '', frequency: 'w', day: '', amount: '', isPayroll: false, startDate: '', active: true })
    setShowForm(false)
    setEditId(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const entry = {
      ...form,
      amount: parseFloat(form.amount) || 0,
      day: parseInt(form.day) || 0,
    }
    if (editId) {
      setExpenses(expenses.map(x => x.id === editId ? { ...entry, id: editId } : x))
    } else {
      setExpenses([...expenses, { ...entry, id: generateId() }])
    }
    resetForm()
  }

  const handleEdit = (exp) => {
    setForm(exp)
    setEditId(exp.id)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    setExpenses(expenses.filter(x => x.id !== id))
  }

  const toggleActive = (id) => {
    setExpenses(expenses.map(x => x.id === id ? { ...x, active: !x.active } : x))
  }

  const totalWeekly = expenses.filter(e => e.active).reduce((sum, e) => {
    if (e.frequency === 'w') return sum + e.amount
    if (e.frequency === 'b') return sum + e.amount / 2
    if (e.frequency === 'm') return sum + e.amount / 4.33
    return sum
  }, 0)

  const totalMonthly = totalWeekly * 4.33
  const totalAnnual = totalWeekly * 52

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Repeat size={24} /> Recurring Expenses
          </h1>
          <p className="text-[#94a3b8] mt-1">Payroll, rent, insurance, and other regular payments</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Weekly Total', value: totalWeekly },
          { label: 'Monthly Total', value: totalMonthly },
          { label: 'Annual Total', value: totalAnnual },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
            <p className="text-sm text-[#94a3b8]">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs text-[#64748b] mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none"
                placeholder="e.g., Payroll"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Frequency</label>
              <select
                value={form.frequency}
                onChange={e => setForm({ ...form, frequency: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none"
              >
                <option value="w">Weekly</option>
                <option value="b">Bi-weekly</option>
                <option value="m">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">
                {form.frequency === 'm' ? 'Day of Month' : form.frequency === 'b' ? 'Start Date' : 'Day'}
              </label>
              {form.frequency === 'b' ? (
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none"
                />
              ) : (
                <input
                  type="number"
                  value={form.day}
                  onChange={e => setForm({ ...form, day: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none"
                  placeholder={form.frequency === 'm' ? '1-31' : ''}
                  min="1"
                  max="31"
                />
              )}
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Amount</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPayroll}
                onChange={e => setForm({ ...form, isPayroll: e.target.checked })}
                className="rounded"
              />
              Payroll expense
            </label>
            <div className="flex-1" />
            <button type="button" onClick={resetForm} className="text-[#94a3b8] hover:text-white px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
              <Check size={14} /> {editId ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* Expenses table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-6 py-3">Name</th>
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-6 py-3">Type</th>
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-6 py-3">Frequency</th>
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-6 py-3">Day</th>
              <th className="text-right text-xs font-medium text-[#64748b] uppercase px-6 py-3">Amount</th>
              <th className="text-center text-xs font-medium text-[#64748b] uppercase px-6 py-3">Active</th>
              <th className="text-right text-xs font-medium text-[#64748b] uppercase px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#64748b]">
                  No recurring expenses yet. Click "Add Expense" to get started.
                </td>
              </tr>
            ) : (
              expenses.map(exp => (
                <tr key={exp.id} className={`border-b border-[#334155]/50 hover:bg-[#334155]/20 ${!exp.active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-3 text-white font-medium">{exp.name}</td>
                  <td className="px-6 py-3">
                    {exp.isPayroll ? (
                      <span className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-1 rounded">Payroll</span>
                    ) : (
                      <span className="text-xs bg-[#334155] text-[#94a3b8] px-2 py-1 rounded">Expense</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-[#94a3b8]">{FREQ_LABELS[exp.frequency]}</td>
                  <td className="px-6 py-3 text-[#94a3b8]">
                    {exp.frequency === 'b' ? (exp.startDate || '—') : (exp.day || '—')}
                  </td>
                  <td className="px-6 py-3 text-right text-white font-mono">{formatCurrency(exp.amount)}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => toggleActive(exp.id)}
                      className={`w-4 h-4 rounded-full border-2 ${exp.active ? 'bg-[#22c55e] border-[#22c55e]' : 'border-[#64748b]'}`}
                    />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleEdit(exp)} className="text-[#94a3b8] hover:text-white mr-2">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(exp.id)} className="text-[#94a3b8] hover:text-[#ef4444]">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
