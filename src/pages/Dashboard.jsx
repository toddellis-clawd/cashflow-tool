import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, Repeat, AlertTriangle, ArrowRight } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import { getData } from '../lib/storage'
import { buildForecast, formatCurrency, formatWeekEnding } from '../lib/forecastEngine'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'

export default function Dashboard() {
  const { company } = useCompany()
  const recurringExpenses = getData('recurring', [])
  const receivables = getData('receivables', []).filter(r => r.status === 'open')
  const payables = getData('payables', []).filter(p => p.status === 'open')

  const forecast = useMemo(() => buildForecast({
    beginningBalance: company?.beginningBalance || 0,
    recurringExpenses,
    receivables,
    payables,
    weekCount: 13,
    startDate: company?.currentWeek ? new Date(company.currentWeek) : new Date(),
    locLimit: company?.locLimit || 0,
  }), [company, recurringExpenses, receivables, payables])

  const chartData = forecast.map(w => ({
    name: format(w.weekEnding, 'M/d'),
    balance: Math.round(w.endingBalance),
  }))

  const thisWeek = forecast[0]
  const weeksNegative = forecast.filter(w => w.endingBalance < 0).length
  const minWeek = forecast.reduce((min, w) => w.endingBalance < min.endingBalance ? w : min, forecast[0] || { endingBalance: 0 })

  const totalWeeklyRecurring = recurringExpenses.filter(e => e.active).reduce((sum, e) => {
    if (e.frequency === 'w') return sum + e.amount
    if (e.frequency === 'b') return sum + e.amount / 2
    if (e.frequency === 'm') return sum + e.amount / 4.33
    return sum
  }, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#94a3b8] mt-1">
          {company?.name} — Week ending {thisWeek ? formatWeekEnding(thisWeek.weekEnding) : '—'}
        </p>
      </div>

      {weeksNegative > 0 && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="text-[#ef4444] shrink-0" size={20} />
          <div>
            <p className="text-[#ef4444] font-medium">Cash Alert</p>
            <p className="text-[#ef4444]/80 text-sm">
              Projected negative balance in {weeksNegative} of the next 13 weeks.
              Lowest: {formatCurrency(minWeek.endingBalance)} on {formatWeekEnding(minWeek.weekEnding)}.
            </p>
          </div>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
            <DollarSign size={16} /> <span className="text-sm">Current Cash</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(company?.beginningBalance || 0)}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
            <Repeat size={16} /> <span className="text-sm">Weekly Burn</span>
          </div>
          <p className="text-2xl font-bold text-[#ef4444]">{formatCurrency(totalWeeklyRecurring)}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
            <ArrowDownCircle size={16} /> <span className="text-sm">Open AR</span>
          </div>
          <p className="text-2xl font-bold text-[#22c55e]">{formatCurrency(receivables.reduce((s, r) => s + r.amount, 0))}</p>
          <p className="text-xs text-[#64748b] mt-1">{receivables.length} invoices</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
            <ArrowUpCircle size={16} /> <span className="text-sm">Open AP</span>
          </div>
          <p className="text-2xl font-bold text-[#f59e0b]">{formatCurrency(payables.reduce((s, p) => s + p.amount, 0))}</p>
          <p className="text-xs text-[#64748b] mt-1">{payables.length} bills</p>
        </div>
      </div>

      {/* 13-week chart */}
      <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">13-Week Cash Outlook</h2>
          <Link to="/forecast" className="text-[#3b82f6] hover:text-[#60a5fa] text-sm flex items-center gap-1">
            View Full 52-Week <ArrowRight size={14} />
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="url(#dashGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { to: '/recurring', icon: Repeat, label: 'Manage Recurring', count: `${recurringExpenses.length} expenses` },
          { to: '/receivables', icon: ArrowDownCircle, label: 'Receivables', count: `${receivables.length} open` },
          { to: '/payables', icon: ArrowUpCircle, label: 'Payables', count: `${payables.length} open` },
        ].map(({ to, icon: Icon, label, count }) => (
          <Link key={to} to={to} className="bg-[#1e293b] rounded-xl p-5 border border-[#334155] hover:border-[#3b82f6] transition-colors group">
            <Icon size={20} className="text-[#94a3b8] group-hover:text-[#3b82f6] transition-colors" />
            <p className="text-white font-medium mt-2">{label}</p>
            <p className="text-xs text-[#64748b] mt-1">{count}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
