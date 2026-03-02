import { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowUpCircle, Pencil, Check, Upload } from 'lucide-react'
import { getData, setData, generateId } from '../lib/storage'
import { formatCurrency } from '../lib/forecastEngine'
import CSVImport from '../components/CSVImport'

export default function Payables() {
  const [items, setItems] = useState(() => getData('payables', []))
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({
    vendor: '', invoiceNumber: '', invoiceDate: '', amount: '', payDate: '', overrideDate: '', status: 'open'
  })

  useEffect(() => { setData('payables', items) }, [items])

  const resetForm = () => { setForm({ vendor: '', invoiceNumber: '', invoiceDate: '', amount: '', payDate: '', overrideDate: '', status: 'open' }); setShowForm(false); setEditId(null) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const entry = { ...form, amount: parseFloat(form.amount) || 0 }
    if (editId) { setItems(items.map(x => x.id === editId ? { ...entry, id: editId } : x)) }
    else { setItems([...items, { ...entry, id: generateId() }]) }
    resetForm()
  }

  const handleEdit = (item) => { setForm(item); setEditId(item.id); setShowForm(true) }
  const handleDelete = (id) => setItems(items.filter(x => x.id !== id))
  const markPaid = (id) => setItems(items.map(x => x.id === id ? { ...x, status: 'paid' } : x))

  const openItems = items.filter(i => i.status === 'open')
  const totalOpen = openItems.reduce((s, i) => s + i.amount, 0)

  return (
    <>
    {showImport && <CSVImport type="payables" onClose={() => setShowImport(false)} onImport={(imported) => {
      const newItems = imported.map(item => ({ id: generateId(), vendor: item.vendor, description: item.description, amount: item.amount, payDate: item.payDate, status: 'open', notes: '' }));
      setItems(prev => [...prev, ...newItems])
    }} />}
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowUpCircle size={24} /> Accounts Payable
          </h1>
          <p className="text-[#94a3b8] mt-1">Track outgoing payments and schedule pay dates</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> Add Bill
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-white rounded-lg hover:bg-[#334155] transition-colors">
            <Upload size={16} /> Import CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Open Bills</p>
          <p className="text-2xl font-bold text-white mt-1">{openItems.length}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Total Owed</p>
          <p className="text-2xl font-bold text-[#ef4444] mt-1">{formatCurrency(totalOpen)}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Vendor</label>
              <input type="text" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none" required />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Invoice #</label>
              <input type="text" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Invoice Date</label>
              <input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Amount</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none" step="0.01" required />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Pay Date</label>
              <input type="date" value={form.payDate} onChange={e => setForm({ ...form, payDate: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] mb-1">Override Date</label>
              <input type="date" value={form.overrideDate} onChange={e => setForm({ ...form, overrideDate: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={resetForm} className="text-[#94a3b8] hover:text-white px-4 py-2 text-sm">Cancel</button>
            <button type="submit" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-2 rounded-lg text-sm font-medium">{editId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-6 py-3">Vendor</th>
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-6 py-3">Invoice #</th>
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-6 py-3">Date</th>
              <th className="text-right text-xs font-medium text-[#64748b] uppercase px-6 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-[#64748b] uppercase px-6 py-3">Pay Date</th>
              <th className="text-center text-xs font-medium text-[#64748b] uppercase px-6 py-3">Status</th>
              <th className="text-right text-xs font-medium text-[#64748b] uppercase px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-[#64748b]">No payables yet.</td></tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className={`border-b border-[#334155]/50 hover:bg-[#334155]/20 ${item.status === 'paid' ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-3 text-white font-medium">{item.vendor}</td>
                  <td className="px-6 py-3 text-[#94a3b8] font-mono text-sm">{item.invoiceNumber || '—'}</td>
                  <td className="px-6 py-3 text-[#94a3b8] text-sm">{item.invoiceDate || '—'}</td>
                  <td className="px-6 py-3 text-right text-white font-mono">{formatCurrency(item.amount)}</td>
                  <td className="px-6 py-3 text-[#94a3b8] text-sm">{item.overrideDate || item.payDate || '—'}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded ${item.status === 'paid' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
                      {item.status === 'paid' ? 'Paid' : 'Open'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right flex items-center justify-end gap-1">
                    {item.status === 'open' && <button onClick={() => markPaid(item.id)} className="text-[#22c55e] hover:text-green-300 mr-1"><Check size={14} /></button>}
                    <button onClick={() => handleEdit(item)} className="text-[#94a3b8] hover:text-white"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-[#94a3b8] hover:text-[#ef4444] ml-1"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  )
}