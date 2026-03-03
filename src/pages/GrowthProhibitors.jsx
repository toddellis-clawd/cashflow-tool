import { useState, useEffect } from 'react'
import { Plus, Trash2, Target, Pencil, X, TrendingUp } from 'lucide-react'
import { getData, setData, generateId } from '../lib/storage'
import { formatCurrency, getWeekEndings, formatWeekEnding } from '../lib/forecastEngine'

export default function GrowthProhibitors() {
  const [items, setItems] = useState(() => getData('growth_prohibitors', []))
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ description: '', annualizedAmount: '', startWeek: '', status: 'identified', notes: '' })

  useEffect(() => { setData('growth_prohibitors', items) }, [items])

  const weekEndings = getWeekEndings(new Date(), 52)

  const handleSave = () => {
    const annualizedAmount = parseFloat(form.annualizedAmount) || 0
    if (!form.description || !annualizedAmount) return

    const item = {
      id: editId || generateId(),
      description: form.description,
      annualizedAmount,
      weeklyAmount: annualizedAmount / 52,
      startWeek: form.startWeek,
      status: form.status,
      notes: form.notes,
    }

    if (editId) {
      setItems(items.map(i => i.id === editId ? item : i))
    } else {
      setItems([...items, item])
    }
    setForm({ description: '', annualizedAmount: '', startWeek: '', status: 'identified', notes: '' })
    setShowForm(false)
    setEditId(null)
  }

  const handleEdit = (item) => {
    setForm({ description: item.description, annualizedAmount: item.annualizedAmount, startWeek: item.startWeek || '', status: item.status, notes: item.notes || '' })
    setEditId(item.id)
    setShowForm(true)
  }

  const handleDelete = (id) => setItems(items.filter(i => i.id !== id))

  const resolved = items.filter(i => i.status === 'resolved')
  const identified = items.filter(i => i.status === 'identified')
  const totalAnnualized = items.reduce((s, i) => s + i.annualizedAmount, 0)
  const totalRecovered = resolved.reduce((s, i) => s + i.annualizedAmount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Target size={24} /> Growth Prohibitors</h1>
          <p className="text-[#94a3b8] mt-1">Track identified blockers and recovered revenue when eliminated</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ description: '', annualizedAmount: '', startWeek: '', status: 'identified', notes: '' }) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb]">
          <Plus size={16} /> Add Prohibitor
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Total Annualized Impact</p>
          <p className="text-2xl font-bold text-[#f59e0b] mt-1">{formatCurrency(totalAnnualized)}</p>
          <p className="text-xs text-[#64748b] mt-1">{items.length} prohibitors identified</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Recovered Revenue</p>
          <p className="text-2xl font-bold text-[#22c55e] mt-1">{formatCurrency(totalRecovered)}</p>
          <p className="text-xs text-[#64748b] mt-1">{resolved.length} resolved</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Remaining Opportunity</p>
          <p className="text-2xl font-bold text-[#ef4444] mt-1">{formatCurrency(totalAnnualized - totalRecovered)}</p>
          <p className="text-xs text-[#64748b] mt-1">{identified.length} unresolved</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">{editId ? 'Edit' : 'Add'} Growth Prohibitor</h3>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-[#64748b] hover:text-white"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-[#64748b] mb-1">Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="e.g., Implement year 2 alarm follow-up" className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Annualized Amount</label>
              <input type="number" value={form.annualizedAmount} onChange={e => setForm({ ...form, annualizedAmount: e.target.value })}
                placeholder="71000" className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm">
                <option value="identified">Identified</option>
                <option value="resolved">Resolved (Revenue Recovered)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Recovery Start Week</label>
              <select value={form.startWeek} onChange={e => setForm({ ...form, startWeek: e.target.value })}
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
              {editId ? 'Update' : 'Add'} Prohibitor
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
              <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3">Annualized</th>
              <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3">Weekly</th>
              <th className="text-center text-xs font-medium text-[#64748b] uppercase px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-4 py-3">Recovery Start</th>
              <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="6" className="text-center text-[#64748b] py-8 text-sm">No growth prohibitors tracked yet. Add blockers you've identified to track recovered revenue.</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="border-b border-[#334155]/30 hover:bg-[#334155]/20">
                <td className="px-4 py-3 text-white text-sm">{item.description}</td>
                <td className="px-4 py-3 text-right text-[#f59e0b] font-mono text-sm">{formatCurrency(item.annualizedAmount)}</td>
                <td className="px-4 py-3 text-right text-[#94a3b8] font-mono text-sm">{formatCurrency(item.annualizedAmount / 52)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'resolved' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'}`}>
                    {item.status === 'resolved' ? 'Resolved' : 'Identified'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#94a3b8] text-sm">{item.startWeek ? formatWeekEnding(new Date(item.startWeek)) : '—'}</td>
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
