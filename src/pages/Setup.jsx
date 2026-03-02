import { useState } from 'react'
import { useCompany } from '../hooks/useCompany'
import { Building2, DollarSign, CreditCard, ArrowRight } from 'lucide-react'

export default function Setup() {
  const { company, setCompany, resetCompany } = useCompany()
  const [form, setForm] = useState(company || {
    name: '',
    fiscalYearStart: 'January',
    beginningBalance: '',
    locName: '',
    locLimit: '',
    currentWeek: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setCompany({
      ...form,
      beginningBalance: parseFloat(form.beginningBalance) || 0,
      locLimit: parseFloat(form.locLimit) || 0,
    })
  }

  const isEditing = !!company

  return (
    <div className={`${isEditing ? '' : 'min-h-screen flex items-center justify-center bg-[#0f172a]'}`}>
      <div className="w-full max-w-lg">
        {!isEditing && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">💰 CashFlow Pro</h1>
            <p className="text-[#94a3b8]">Weekly cash flow forecasting for your business</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#1e293b] rounded-xl p-8 border border-[#334155] space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Building2 size={20} />
            {isEditing ? 'Company Settings' : 'Set Up Your Company'}
          </h2>

          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Company Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2.5 text-white focus:border-[#3b82f6] focus:outline-none"
              placeholder="Your Business Name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Fiscal Year Starts</label>
            <select
              value={form.fiscalYearStart}
              onChange={e => setForm({ ...form, fiscalYearStart: e.target.value })}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2.5 text-white focus:border-[#3b82f6] focus:outline-none"
            >
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Current Week Ending</label>
            <input
              type="date"
              value={form.currentWeek}
              onChange={e => setForm({ ...form, currentWeek: e.target.value })}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2.5 text-white focus:border-[#3b82f6] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1 flex items-center gap-1">
              <DollarSign size={14} /> Beginning Cash Balance
            </label>
            <input
              type="number"
              value={form.beginningBalance}
              onChange={e => setForm({ ...form, beginningBalance: e.target.value })}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2.5 text-white focus:border-[#3b82f6] focus:outline-none"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>

          <div className="border-t border-[#334155] pt-4">
            <h3 className="text-sm font-semibold text-[#94a3b8] mb-3 flex items-center gap-1">
              <CreditCard size={14} /> Line of Credit (Optional)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#64748b] mb-1">LOC Name</label>
                <input
                  type="text"
                  value={form.locName}
                  onChange={e => setForm({ ...form, locName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none"
                  placeholder="Bank LOC"
                />
              </div>
              <div>
                <label className="block text-xs text-[#64748b] mb-1">Max Limit</label>
                <input
                  type="number"
                  value={form.locLimit}
                  onChange={e => setForm({ ...form, locLimit: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:border-[#3b82f6] focus:outline-none"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isEditing ? 'Save Changes' : 'Get Started'} <ArrowRight size={16} />
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={resetCompany}
              className="w-full text-[#ef4444] hover:text-red-300 text-sm py-2 transition-colors"
            >
              Reset All Data
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
