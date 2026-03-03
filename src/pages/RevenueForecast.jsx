import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Plus, Trash2, Calculator, Calendar } from 'lucide-react'
import { getData, setData, generateId } from '../lib/storage'
import { formatCurrency } from '../lib/forecastEngine'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend } from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function calcGrowthRate(years) {
  if (years.length < 2) return 0
  const sorted = [...years].sort((a, b) => a.year - b.year).filter(y => y.total > 0)
  if (sorted.length < 2) return 0
  const first = sorted[0].total
  const last = sorted[sorted.length - 1].total
  const n = sorted.length - 1
  return ((Math.pow(last / first, 1 / n)) - 1) * 100
}

function calcSeasonalPct(years) {
  const pcts = MONTHS.map((_, mi) => {
    const vals = years.filter(y => y.total > 0).map(y => {
      const monthVal = y.months[mi] || 0
      return y.total > 0 ? (monthVal / y.total) * 100 : 0
    })
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 8.33
  })
  // Normalize to 100%
  const sum = pcts.reduce((a, b) => a + b, 0)
  return pcts.map(p => (p / sum) * 100)
}

export default function RevenueForecast() {
  const [years, setYears] = useState(() => getData('revenue_years', []))
  const [target, setTarget] = useState(() => getData('revenue_target', { year: new Date().getFullYear(), amount: 0, useGrowth: true }))
  const [actuals, setActuals] = useState(() => getData('revenue_actuals', Array(12).fill(0)))
  const [overrides, setOverrides] = useState(() => getData('revenue_seasonal_overrides', Array(12).fill(null)))
  const [addYear, setAddYear] = useState('')

  useEffect(() => { setData('revenue_years', years) }, [years])
  useEffect(() => { setData('revenue_target', target) }, [target])
  useEffect(() => { setData('revenue_actuals', actuals) }, [actuals])
  useEffect(() => { setData('revenue_seasonal_overrides', overrides) }, [overrides])

  const growthRate = useMemo(() => calcGrowthRate(years), [years])
  const seasonalPct = useMemo(() => calcSeasonalPct(years), [years])
  const effectivePct = seasonalPct.map((p, i) => overrides[i] !== null ? overrides[i] : p)

  const lastYearTotal = years.length > 0 ? [...years].sort((a, b) => b.year - a.year)[0]?.total || 0 : 0
  const projectedTarget = lastYearTotal * (1 + growthRate / 100)
  const effectiveTarget = target.useGrowth ? projectedTarget : target.amount

  // Monthly forecast
  const monthlyForecast = effectivePct.map(p => (effectiveTarget * p) / 100)
  const ytdActual = actuals.reduce((a, b) => a + b, 0)
  const ytdForecast = monthlyForecast.reduce((a, b) => a + b, 0)

  // Trending: for months without actuals, use forecast; for months with actuals, use actual
  const currentMonth = new Date().getMonth()
  const trending = MONTHS.map((_, i) => {
    if (i <= currentMonth && actuals[i] > 0) return actuals[i]
    return monthlyForecast[i]
  })
  const trendingTotal = trending.reduce((a, b) => a + b, 0)

  // Chart data
  const chartData = MONTHS.map((m, i) => ({
    month: m,
    forecast: Math.round(monthlyForecast[i]),
    actual: actuals[i] || 0,
    seasonal: effectivePct[i].toFixed(1),
  }))

  const handleAddYear = () => {
    const y = parseInt(addYear)
    if (!y || years.find(yr => yr.year === y)) return
    setYears([...years, { id: generateId(), year: y, months: Array(12).fill(0), total: 0 }])
    setAddYear('')
  }

  const updateYearMonth = (yearId, monthIdx, val) => {
    setYears(years.map(y => {
      if (y.id !== yearId) return y
      const months = [...y.months]
      months[monthIdx] = parseFloat(val) || 0
      return { ...y, months, total: months.reduce((a, b) => a + b, 0) }
    }))
  }

  const updateActual = (monthIdx, val) => {
    const newActuals = [...actuals]
    newActuals[monthIdx] = parseFloat(val) || 0
    setActuals(newActuals)
  }

  const updateOverride = (monthIdx, val) => {
    const newOverrides = [...overrides]
    newOverrides[monthIdx] = val === '' ? null : parseFloat(val) || 0
    setOverrides(newOverrides)
  }

  // Save seasonal + monthly forecast to storage for the forecast engine
  useEffect(() => {
    const weeklyRevenue = monthlyForecast.map(m => m / 4.33)
    const forecastData = {
      seasonalPct: effectivePct,
      monthlyForecast,
      weeklyRevenue,
      annualTarget: effectiveTarget,
      actuals,
    }
    setData('revenue_forecast', forecastData)
  }, [effectivePct, effectiveTarget, actuals])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={24} /> Revenue Forecast
        </h1>
        <p className="text-[#94a3b8] mt-1">Historical sales, seasonality engine, and revenue projections</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Growth Rate (CAGR)</p>
          <p className="text-2xl font-bold text-[#3b82f6] mt-1">{growthRate.toFixed(1)}%</p>
          <p className="text-xs text-[#64748b] mt-1">{years.length} years of data</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">{target.year} Target</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(effectiveTarget)}</p>
          <p className="text-xs text-[#64748b] mt-1">{target.useGrowth ? 'Growth projected' : 'Manual override'}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">YTD Actual</p>
          <p className="text-2xl font-bold text-[#22c55e] mt-1">{formatCurrency(ytdActual)}</p>
          <p className="text-xs text-[#64748b] mt-1">{ytdForecast > 0 ? ((ytdActual / ytdForecast) * 100).toFixed(1) : 0}% of forecast</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155]">
          <p className="text-sm text-[#94a3b8]">Trending Total</p>
          <p className="text-2xl font-bold text-[#f59e0b] mt-1">{formatCurrency(trendingTotal)}</p>
          <p className="text-xs text-[#64748b] mt-1">Actuals + remaining forecast</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Monthly Forecast vs Actual</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={v => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="forecast" fill="#3b82f6" opacity={0.4} name="Forecast" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill="#22c55e" name="Actual" radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Target Settings */}
      <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calculator size={18} /> Revenue Target</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[#64748b] mb-1">Forecast Year</label>
            <input type="number" value={target.year} onChange={e => setTarget({ ...target, year: parseInt(e.target.value) || new Date().getFullYear() })}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#64748b] mb-1">Target Revenue</label>
            <input type="number" value={target.amount || ''} onChange={e => setTarget({ ...target, amount: parseFloat(e.target.value) || 0, useGrowth: false })}
              placeholder={`Growth projection: ${formatCurrency(projectedTarget)}`}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={target.useGrowth} onChange={e => setTarget({ ...target, useGrowth: e.target.checked })}
                className="accent-[#3b82f6]" />
              <span className="text-sm text-[#94a3b8]">Use growth rate projection</span>
            </label>
          </div>
        </div>
      </div>

      {/* Seasonality Table */}
      <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calendar size={18} /> Seasonal Distribution</h2>
        <p className="text-xs text-[#64748b] mb-4">Auto-calculated from historical data. Override any month manually.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left text-xs font-medium text-[#64748b] uppercase px-2 py-2">Month</th>
                {MONTHS.map(m => <th key={m} className="text-center text-xs font-medium text-[#64748b] uppercase px-2 py-2">{m}</th>)}
                <th className="text-center text-xs font-medium text-[#64748b] uppercase px-2 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#334155]/30">
                <td className="px-2 py-2 text-[#94a3b8] text-xs">Calculated %</td>
                {seasonalPct.map((p, i) => <td key={i} className="text-center px-2 py-1.5 text-[#64748b] text-xs">{p.toFixed(1)}%</td>)}
                <td className="text-center px-2 py-1.5 text-[#64748b] text-xs">100%</td>
              </tr>
              <tr className="border-b border-[#334155]/30">
                <td className="px-2 py-2 text-[#94a3b8] text-xs">Override %</td>
                {overrides.map((o, i) => (
                  <td key={i} className="px-1 py-1">
                    <input type="number" step="0.1" value={o ?? ''} onChange={e => updateOverride(i, e.target.value)}
                      placeholder="—" className="w-full bg-[#0f172a] border border-[#334155] rounded px-1 py-1 text-white text-xs text-center" />
                  </td>
                ))}
                <td className="text-center text-xs text-[#64748b]">{effectivePct.reduce((a, b) => a + b, 0).toFixed(1)}%</td>
              </tr>
              <tr className="border-b border-[#334155]/30">
                <td className="px-2 py-2 text-white text-xs font-medium">Forecast $</td>
                {monthlyForecast.map((f, i) => <td key={i} className="text-center px-2 py-1.5 text-[#3b82f6] text-xs font-mono">{formatCurrency(f)}</td>)}
                <td className="text-center px-2 py-1.5 text-[#3b82f6] text-xs font-bold font-mono">{formatCurrency(effectiveTarget)}</td>
              </tr>
              <tr className="border-b border-[#334155]/30">
                <td className="px-2 py-2 text-white text-xs font-medium">Actual $</td>
                {actuals.map((a, i) => (
                  <td key={i} className="px-1 py-1">
                    <input type="number" value={a || ''} onChange={e => updateActual(i, e.target.value)}
                      placeholder="0" className="w-full bg-[#0f172a] border border-[#334155] rounded px-1 py-1 text-[#22c55e] text-xs text-center font-mono" />
                  </td>
                ))}
                <td className="text-center px-2 py-1.5 text-[#22c55e] text-xs font-bold font-mono">{formatCurrency(ytdActual)}</td>
              </tr>
              <tr>
                <td className="px-2 py-2 text-white text-xs font-medium">Variance</td>
                {MONTHS.map((_, i) => {
                  const v = (actuals[i] || 0) - monthlyForecast[i]
                  return <td key={i} className={`text-center px-2 py-1.5 text-xs font-mono ${v >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {actuals[i] ? formatCurrency(v) : '—'}
                  </td>
                })}
                <td className={`text-center px-2 py-1.5 text-xs font-bold font-mono ${ytdActual - ytdForecast >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {formatCurrency(ytdActual - ytdForecast)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Years */}
      <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Historical Sales Data</h2>
          <div className="flex gap-2">
            <input type="number" value={addYear} onChange={e => setAddYear(e.target.value)} placeholder="Year"
              className="w-24 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm" />
            <button onClick={handleAddYear} className="flex items-center gap-1 px-3 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb]">
              <Plus size={14} /> Add Year
            </button>
          </div>
        </div>

        {years.length === 0 ? (
          <p className="text-[#64748b] text-sm text-center py-8">Add historical years to calculate seasonal patterns and growth rate.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left text-xs font-medium text-[#64748b] uppercase px-2 py-2">Year</th>
                  {MONTHS.map(m => <th key={m} className="text-center text-xs font-medium text-[#64748b] uppercase px-2 py-2">{m}</th>)}
                  <th className="text-center text-xs font-medium text-[#64748b] uppercase px-2 py-2">Total</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {[...years].sort((a, b) => a.year - b.year).map(yr => (
                  <tr key={yr.id} className="border-b border-[#334155]/30">
                    <td className="px-2 py-2 text-white font-medium">{yr.year}</td>
                    {yr.months.map((v, mi) => (
                      <td key={mi} className="px-1 py-1">
                        <input type="number" value={v || ''} onChange={e => updateYearMonth(yr.id, mi, e.target.value)}
                          placeholder="0" className="w-full bg-[#0f172a] border border-[#334155] rounded px-1 py-1 text-white text-xs text-center font-mono" />
                      </td>
                    ))}
                    <td className="text-center px-2 py-1.5 text-white font-mono text-xs font-bold">{formatCurrency(yr.total)}</td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => setYears(years.filter(y => y.id !== yr.id))} className="text-[#64748b] hover:text-[#ef4444]"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
