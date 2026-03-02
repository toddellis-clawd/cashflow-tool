import { useMemo } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'
import { getData } from '../lib/storage'
import { buildForecast, formatCurrency, formatWeekEnding } from '../lib/forecastEngine'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'

export default function CashForecast() {
  const { company } = useCompany()
  const recurringExpenses = getData('recurring', [])
  const receivables = getData('receivables', []).filter(r => r.status === 'open')
  const payables = getData('payables', []).filter(p => p.status === 'open')

  const forecast = useMemo(() => buildForecast({
    beginningBalance: company?.beginningBalance || 0,
    recurringExpenses,
    receivables,
    payables,
    weekCount: 52,
    startDate: company?.currentWeek ? new Date(company.currentWeek) : new Date(),
    locLimit: company?.locLimit || 0,
  }), [company, recurringExpenses, receivables, payables])

  const chartData = forecast.map(w => ({
    name: format(w.weekEnding, 'M/d'),
    balance: Math.round(w.endingBalance),
    receipts: Math.round(w.totalReceipts),
    disbursements: Math.round(w.totalDisbursements),
  }))

  const minBalance = Math.min(...forecast.map(w => w.endingBalance))
  const maxBalance = Math.max(...forecast.map(w => w.endingBalance))
  const weeksNegative = forecast.filter(w => w.endingBalance < 0).length
  const currentQuarter = forecast.filter(w => w.quarter === 1)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm">
        <p className="text-white font-medium mb-1">Week of {label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={24} /> 52-Week Cash Forecast
        </h1>
        <p className="text-[#94a3b8] mt-1">Projected cash position based on recurring expenses, AR, and AP</p>
      </div>

      {/* Alert banner */}
      {weeksNegative > 0 && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="text-[#ef4444] shrink-0" size={20} />
          <p className="text-[#ef4444] text-sm font-medium">
            Cash goes negative in {weeksNegative} week{weeksNegative > 1 ? 's' : ''}. Review your forecast and adjust payment schedules.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Current Balance</p>
          <p className={`text-2xl font-bold mt-1 ${company?.beginningBalance >= 0 ? 'text-white' : 'text-[#ef4444]'}`}>
            {formatCurrency(company?.beginningBalance || 0)}
          </p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Week 13 Position</p>
          <p className={`text-2xl font-bold mt-1 ${(forecast[12]?.endingBalance || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {formatCurrency(forecast[12]?.endingBalance || 0)}
          </p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Lowest Point</p>
          <p className={`text-2xl font-bold mt-1 ${minBalance >= 0 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
            {formatCurrency(minBalance)}
          </p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Week 52 Position</p>
          <p className={`text-2xl font-bold mt-1 ${(forecast[51]?.endingBalance || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {formatCurrency(forecast[51]?.endingBalance || 0)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Cash Position Over Time</h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="url(#balanceGrad)" name="Balance" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly detail table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left text-xs font-medium text-[#64748b] uppercase px-4 py-3 sticky left-0 bg-[#1e293b]">Wk</th>
                <th className="text-left text-xs font-medium text-[#64748b] uppercase px-4 py-3">Week Ending</th>
                <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3">Beginning</th>
                <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3 text-[#22c55e]">Receipts</th>
                <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3 text-[#ef4444]">Recurring</th>
                <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3 text-[#ef4444]">AP</th>
                <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3">Net</th>
                <th className="text-right text-xs font-medium text-[#64748b] uppercase px-4 py-3">Ending</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((w, i) => (
                <tr key={i} className={`border-b border-[#334155]/30 hover:bg-[#334155]/20 ${w.endingBalance < 0 ? 'bg-[#ef4444]/5' : ''} ${w.quarter !== forecast[i-1]?.quarter && i > 0 ? 'border-t-2 border-t-[#3b82f6]/30' : ''}`}>
                  <td className="px-4 py-2.5 text-[#64748b] text-sm sticky left-0 bg-[#1e293b]">{w.week}</td>
                  <td className="px-4 py-2.5 text-white text-sm">{formatWeekEnding(w.weekEnding)}</td>
                  <td className="px-4 py-2.5 text-right text-[#94a3b8] font-mono text-sm">{formatCurrency(w.beginningBalance)}</td>
                  <td className="px-4 py-2.5 text-right text-[#22c55e] font-mono text-sm">{w.totalReceipts > 0 ? formatCurrency(w.totalReceipts) : '—'}</td>
                  <td className="px-4 py-2.5 text-right text-[#ef4444] font-mono text-sm">{w.totalRecurring > 0 ? `-${formatCurrency(w.totalRecurring)}` : '—'}</td>
                  <td className="px-4 py-2.5 text-right text-[#ef4444] font-mono text-sm">{w.totalPayables > 0 ? `-${formatCurrency(w.totalPayables)}` : '—'}</td>
                  <td className={`px-4 py-2.5 text-right font-mono text-sm font-medium ${w.netCashFlow >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {formatCurrency(w.netCashFlow)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono text-sm font-bold ${w.endingBalance >= 0 ? 'text-white' : 'text-[#ef4444]'}`}>
                    {formatCurrency(w.endingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
