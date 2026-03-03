import { useMemo } from 'react'
import { TrendingUp, AlertTriangle } from 'lucide-react'
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
  const oneTimeExpenses = getData('onetime_expenses', [])
  const growthProhibitors = getData('growth_prohibitors', [])

  const forecast = useMemo(() => buildForecast({
    beginningBalance: company?.beginningBalance || 0,
    recurringExpenses,
    receivables,
    payables,
    oneTimeExpenses,
    growthProhibitors,
    weekCount: 52,
    startDate: company?.currentWeek ? new Date(company.currentWeek) : new Date(),
    locLimit: company?.locLimit || 0,
  }), [company, recurringExpenses, receivables, payables, oneTimeExpenses, growthProhibitors])

  const chartData = forecast.map(w => ({
    name: format(w.weekEnding, 'M/d'),
    balance: Math.round(w.endingBalance),
  }))

  const minBalance = Math.min(...forecast.map(w => w.endingBalance))
  const weeksNegative = forecast.filter(w => w.endingBalance < 0).length

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm">
        <p className="text-white font-medium mb-1">Week of {label}</p>
        <p className="text-[#3b82f6]">Ending Balance: {formatCurrency(payload[0].value)}</p>
      </div>
    )
  }

  // Quarter labels
  const quarterStarts = [0, 13, 26, 39]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={24} /> Cash Forecast Model
        </h1>
        <p className="text-[#94a3b8] mt-1">52-week rolling cash forecast — {company?.name}</p>
      </div>

      {weeksNegative > 0 && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="text-[#ef4444] shrink-0" size={20} />
          <p className="text-[#ef4444] text-sm font-medium">
            Cash goes negative in {weeksNegative} week{weeksNegative > 1 ? 's' : ''}. Lowest point: {formatCurrency(minBalance)}.
          </p>
        </div>
      )}

      {/* Summary Cards - Dollar amounts prominent */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Beginning Balance</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(company?.beginningBalance || 0)}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">End of Q1 (Wk 13)</p>
          <p className={`text-2xl font-bold mt-1 ${(forecast[12]?.endingBalance || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {formatCurrency(forecast[12]?.endingBalance || 0)}
          </p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">End of Q2 (Wk 26)</p>
          <p className={`text-2xl font-bold mt-1 ${(forecast[25]?.endingBalance || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {formatCurrency(forecast[25]?.endingBalance || 0)}
          </p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">End of Year (Wk 52)</p>
          <p className={`text-2xl font-bold mt-1 ${(forecast[51]?.endingBalance || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {formatCurrency(forecast[51]?.endingBalance || 0)}
          </p>
        </div>
      </div>

      {/* Cash Position Chart */}
      <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Ending Cash Available</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => formatCurrency(v)} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="url(#balanceGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Full Forecast Table - matches Excel structure */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left text-xs font-medium text-[#64748b] uppercase px-3 py-3 sticky left-0 bg-[#1e293b] min-w-[200px]">Category</th>
                {forecast.map((w, i) => (
                  <th key={i} className={`text-right text-xs font-medium text-[#64748b] px-3 py-2 min-w-[110px] ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                    <div>Wk {w.week}</div>
                    <div className="text-[10px] text-[#475569]">{format(w.weekEnding, 'M/d/yy')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* (A) BEGINNING BALANCE */}
              <tr className="bg-[#0f172a]/50 border-b border-[#334155]">
                <td className="px-3 py-2.5 font-bold text-white sticky left-0 bg-[#0f172a]/80">(A) BEGINNING BALANCE</td>
                {forecast.map((w, i) => (
                  <td key={i} className={`px-3 py-2.5 text-right font-mono font-bold text-white ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                    {formatCurrency(w.beginningBalance)}
                  </td>
                ))}
              </tr>

              {/* (B) CASH RECEIPTS */}
              <tr className="border-b border-[#334155]/50">
                <td className="px-3 py-2 font-semibold text-[#22c55e] sticky left-0 bg-[#1e293b]">(B) CASH RECEIPTS</td>
                {forecast.map((w, i) => <td key={i} className={`px-3 py-2 ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}></td>)}
              </tr>
              <tr className="border-b border-[#334155]/20">
                <td className="px-3 py-1.5 text-[#94a3b8] pl-6 sticky left-0 bg-[#1e293b]">Received on AR</td>
                {forecast.map((w, i) => (
                  <td key={i} className={`px-3 py-1.5 text-right font-mono text-[#22c55e] ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                    {w.arReceipts > 0 ? formatCurrency(w.arReceipts) : '—'}
                  </td>
                ))}
              </tr>
              <tr className="bg-[#22c55e]/5 border-b border-[#334155]/50">
                <td className="px-3 py-2 font-semibold text-[#22c55e] sticky left-0 bg-[#22c55e]/5">TOTAL INFLOW</td>
                {forecast.map((w, i) => (
                  <td key={i} className={`px-3 py-2 text-right font-mono font-bold text-[#22c55e] ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                    {w.totalInflow > 0 ? formatCurrency(w.totalInflow) : '—'}
                  </td>
                ))}
              </tr>

              {/* (C) CASH DISBURSEMENTS */}
              <tr className="border-b border-[#334155]/50">
                <td className="px-3 py-2 font-semibold text-[#ef4444] sticky left-0 bg-[#1e293b]">(C) CASH DISBURSEMENTS</td>
                {forecast.map((w, i) => <td key={i} className={`px-3 py-2 ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}></td>)}
              </tr>
              <tr className="border-b border-[#334155]/20">
                <td className="px-3 py-1.5 text-[#94a3b8] pl-6 sticky left-0 bg-[#1e293b]">Payrolls</td>
                {forecast.map((w, i) => (
                  <td key={i} className={`px-3 py-1.5 text-right font-mono text-[#ef4444] ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                    {w.totalPayroll > 0 ? formatCurrency(w.totalPayroll) : '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[#334155]/20">
                <td className="px-3 py-1.5 text-[#94a3b8] pl-6 sticky left-0 bg-[#1e293b]">Recurring Expenses</td>
                {forecast.map((w, i) => (
                  <td key={i} className={`px-3 py-1.5 text-right font-mono text-[#ef4444] ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                    {w.totalRecurring > 0 ? formatCurrency(w.totalRecurring) : '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[#334155]/20">
                <td className="px-3 py-1.5 text-[#94a3b8] pl-6 sticky left-0 bg-[#1e293b]">Accounts Payable</td>
                {forecast.map((w, i) => (
                  <td key={i} className={`px-3 py-1.5 text-right font-mono text-[#ef4444] ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                    {w.totalAP > 0 ? formatCurrency(w.totalAP) : '—'}
                  </td>
                ))}
              </tr>
              {/* One-time expense rows */}
              {oneTimeExpenses.map(exp => (
                <tr key={exp.id} className="border-b border-[#334155]/20">
                  <td className="px-3 py-1.5 text-[#f59e0b] pl-6 sticky left-0 bg-[#1e293b] text-xs">{exp.description}</td>
                  {forecast.map((w, i) => {
                    const hit = w.oneTimeItems?.find(o => o.description === exp.description)
                    return (
                      <td key={i} className={`px-3 py-1.5 text-right font-mono text-[#f59e0b] text-xs ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                        {hit ? formatCurrency(hit.amount) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className="bg-[#ef4444]/5 border-b border-[#334155]/50">
                <td className="px-3 py-2 font-semibold text-[#ef4444] sticky left-0 bg-[#ef4444]/5">TOTAL OUTFLOW</td>
                {forecast.map((w, i) => (
                  <td key={i} className={`px-3 py-2 text-right font-mono font-bold text-[#ef4444] ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                    {w.totalOutflow > 0 ? formatCurrency(w.totalOutflow) : '—'}
                  </td>
                ))}
              </tr>

              {/* (E) ENDING CASH AVAILABLE */}
              <tr className="bg-[#0f172a]/50 border-b border-[#334155]">
                <td className="px-3 py-3 font-bold text-white sticky left-0 bg-[#0f172a]/80">(E) ENDING CASH AVAILABLE</td>
                {forecast.map((w, i) => (
                  <td key={i} className={`px-3 py-3 text-right font-mono font-bold text-lg ${w.endingBalance >= 0 ? 'text-white' : 'text-[#ef4444]'} ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                    {formatCurrency(w.endingBalance)}
                  </td>
                ))}
              </tr>

              {/* GROWTH PROHIBITORS - at the very bottom per Kerri */}
              {growthProhibitors.length > 0 && (
                <>
                  <tr className="border-b border-[#334155]/50 border-t-2 border-t-[#f59e0b]/30">
                    <td className="px-3 py-2 font-semibold text-[#f59e0b] sticky left-0 bg-[#1e293b]">GROWTH PROHIBITORS</td>
                    {forecast.map((w, i) => <td key={i} className={`px-3 py-2 ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}></td>)}
                  </tr>
                  {growthProhibitors.filter(p => p.status === 'resolved').map(p => (
                    <tr key={p.id} className="border-b border-[#334155]/20">
                      <td className="px-3 py-1.5 text-[#22c55e] pl-6 sticky left-0 bg-[#1e293b] text-xs">✓ {p.description}</td>
                      {forecast.map((w, i) => {
                        const startWeek = p.startWeek ? new Date(p.startWeek) : null
                        const active = startWeek && w.weekEnding >= startWeek
                        return (
                          <td key={i} className={`px-3 py-1.5 text-right font-mono text-xs text-[#22c55e] ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                            {active ? formatCurrency(p.annualizedAmount / 52) : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  {growthProhibitors.filter(p => p.status === 'identified').map(p => (
                    <tr key={p.id} className="border-b border-[#334155]/20">
                      <td className="px-3 py-1.5 text-[#f59e0b] pl-6 sticky left-0 bg-[#1e293b] text-xs">⚠ {p.description}</td>
                      {forecast.map((w, i) => (
                        <td key={i} className={`px-3 py-1.5 text-right font-mono text-xs text-[#64748b] ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                          {formatCurrency(p.annualizedAmount / 52)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-[#f59e0b]/5">
                    <td className="px-3 py-2 font-semibold text-[#f59e0b] sticky left-0 bg-[#f59e0b]/5">ANNUALIZED BENEFIT TOTAL</td>
                    {forecast.map((w, i) => (
                      <td key={i} className={`px-3 py-2 text-right font-mono font-bold text-[#f59e0b] ${i > 0 && w.quarter !== forecast[i-1].quarter ? 'border-l-2 border-l-[#3b82f6]/30' : ''}`}>
                        {formatCurrency(growthProhibitors.reduce((s, p) => s + p.annualizedAmount / 52, 0))}
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
