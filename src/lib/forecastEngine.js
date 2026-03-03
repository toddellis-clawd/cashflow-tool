import { addDays, nextSaturday, isSaturday, format, startOfDay, isWithinInterval, addWeeks } from 'date-fns'

export function getWeekEnding(date) {
  const d = startOfDay(new Date(date))
  return isSaturday(d) ? d : nextSaturday(d)
}

export function getWeekEndings(startDate, count = 52) {
  const first = getWeekEnding(startDate)
  return Array.from({ length: count }, (_, i) => addDays(first, i * 7))
}

export function formatCurrency(amount) {
  const abs = Math.abs(amount || 0)
  const formatted = abs.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return amount < 0 ? `(${formatted})` : formatted
}

export function formatWeekEnding(date) {
  return format(new Date(date), 'MMM d, yyyy')
}

// Get recurring expenses for a specific week
export function getRecurringForWeek(expenses, weekEnding, weekIndex) {
  const we = startOfDay(new Date(weekEnding))
  return expenses.filter(e => {
    if (!e.active) return false
    if (e.frequency === 'w') return true
    if (e.frequency === 'b') {
      const start = e.startDate ? startOfDay(new Date(e.startDate)) : we
      const diff = Math.round((we - start) / (7 * 24 * 60 * 60 * 1000))
      return diff % 2 === 0
    }
    if (e.frequency === 'm') {
      const dayOfMonth = e.dayOfMonth || 1
      const weDate = we.getDate()
      return weDate >= dayOfMonth && weDate < dayOfMonth + 7
    }
    return false
  })
}

// Get one-time expenses for a specific week
export function getOneTimeForWeek(expenses, weekEnding) {
  const we = startOfDay(new Date(weekEnding))
  return expenses.filter(e => {
    if (!e.weekDate) return false
    const startWeek = startOfDay(getWeekEnding(new Date(e.weekDate)))
    const weeks = e.weeks || 1
    const endWeek = addDays(startWeek, (weeks - 1) * 7)
    return we >= startWeek && we <= endWeek
  })
}

// Get growth prohibitor revenue for a specific week
export function getProhibitorRevenueForWeek(prohibitors, weekEnding) {
  const we = startOfDay(new Date(weekEnding))
  return prohibitors.filter(p => {
    if (p.status !== 'resolved' || !p.startWeek) return false
    const startWeek = startOfDay(getWeekEnding(new Date(p.startWeek)))
    return we >= startWeek
  }).reduce((sum, p) => sum + (p.annualizedAmount / 52), 0)
}

// Build the full forecast matching Excel structure
export function buildForecast({
  beginningBalance = 0,
  recurringExpenses = [],
  receivables = [],
  payables = [],
  oneTimeExpenses = [],
  growthProhibitors = [],
  consultingFees = [],
  weekCount = 52,
  startDate = new Date(),
  locLimit = 0,
}) {
  const weekEndings = getWeekEndings(startDate, weekCount)
  const forecast = []
  let runningBalance = beginningBalance

  for (let i = 0; i < weekCount; i++) {
    const we = weekEndings[i]
    const weekStart = addDays(we, -6)

    // (B) CASH RECEIPTS
    // AR from receivables that fall in this week
    const weekReceivables = receivables.filter(r => {
      if (r.status !== 'open') return false
      const pDate = r.promiseDate ? startOfDay(new Date(r.promiseDate)) : null
      if (!pDate) return false
      return isWithinInterval(pDate, { start: weekStart, end: we })
    })
    const arReceipts = weekReceivables.reduce((s, r) => s + (r.amount || 0), 0)

    // Revenue from resolved growth prohibitors
    const prohibitorRevenue = getProhibitorRevenueForWeek(growthProhibitors, we)

    const totalInflow = arReceipts + prohibitorRevenue

    // (C) CASH DISBURSEMENTS
    // Payroll (recurring items flagged as payroll)
    const payrollItems = getRecurringForWeek(recurringExpenses.filter(e => e.isPayroll), we, i)
    const totalPayroll = payrollItems.reduce((s, e) => s + e.amount, 0)

    // Recurring (non-payroll)
    const recurringItems = getRecurringForWeek(recurringExpenses.filter(e => !e.isPayroll), we, i)
    const totalRecurring = recurringItems.reduce((s, e) => s + e.amount, 0)

    // AP
    const weekPayables = payables.filter(p => {
      if (p.status !== 'open') return false
      const payDate = p.overrideDate || p.payDate
      if (!payDate) return false
      const pDate = startOfDay(new Date(payDate))
      return isWithinInterval(pDate, { start: weekStart, end: we })
    })
    const totalAP = weekPayables.reduce((s, p) => s + (p.amount || 0), 0)

    // One-time expenses
    const oneTimeItems = getOneTimeForWeek(oneTimeExpenses, we)
    const totalOneTime = oneTimeItems.reduce((s, e) => s + e.amount, 0)

    const totalOutflow = totalPayroll + totalRecurring + totalAP + totalOneTime

    // Net cash flow
    const netCashFlow = totalInflow - totalOutflow

    // LOC calculations
    let locUsed = 0
    let locPaid = 0
    let endingBalance = runningBalance + netCashFlow

    // Determine quarter (13 weeks each)
    const quarter = Math.floor(i / 13) + 1

    forecast.push({
      week: i + 1,
      weekEnding: we,
      quarter,
      // (A) Beginning
      beginningBalance: runningBalance,
      // (B) Inflow
      arReceipts,
      prohibitorRevenue,
      totalInflow,
      // (C) Outflow
      totalPayroll,
      totalRecurring,
      totalAP,
      totalOneTime,
      oneTimeItems: oneTimeItems.map(e => ({ description: e.description, amount: e.amount })),
      totalOutflow,
      // Net
      netCashFlow,
      totalReceipts: totalInflow,
      totalDisbursements: totalOutflow,
      // LOC
      locUsed,
      locPaid,
      locBalance: 0,
      locAvailable: locLimit,
      // (E) Ending
      endingBalance,
    })

    runningBalance = endingBalance
  }

  return forecast
}
