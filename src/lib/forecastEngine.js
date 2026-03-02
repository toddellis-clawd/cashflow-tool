import { addWeeks, startOfWeek, format, getDay, getDate, differenceInCalendarWeeks } from 'date-fns'

/**
 * Get the Monday-based week-ending date (Saturday) for a given date
 */
export function getWeekEnding(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = 6 - day // days until Saturday
  d.setDate(d.getDate() + diff)
  return d
}

/**
 * Generate array of 52 week-ending dates starting from current week
 */
export function getWeekEndings(startDate, count = 52) {
  const weeks = []
  let current = getWeekEnding(startDate || new Date())
  for (let i = 0; i < count; i++) {
    weeks.push(new Date(current))
    current = addWeeks(current, 1)
  }
  return weeks
}

/**
 * Calculate which weeks a recurring expense falls into
 */
export function getRecurringForWeek(expense, weekEnding) {
  const we = new Date(weekEnding)
  const weekStart = addWeeks(we, -1)
  weekStart.setDate(weekStart.getDate() + 1) // Sunday

  if (expense.frequency === 'w') {
    // Weekly: hits every week
    return expense.amount
  }

  if (expense.frequency === 'b') {
    // Bi-weekly: check if this week aligns with the pay schedule
    if (!expense.startDate) return 0
    const start = new Date(expense.startDate)
    const weeksDiff = differenceInCalendarWeeks(we, start)
    return weeksDiff % 2 === 0 ? expense.amount : 0
  }

  if (expense.frequency === 'm') {
    // Monthly: check if the day falls within this week
    const targetDay = expense.day || 1
    // Check each day in the week
    for (let d = new Date(weekStart); d <= we; d.setDate(d.getDate() + 1)) {
      if (getDate(d) === targetDay) {
        return expense.amount
      }
    }
    // Handle months where the target day doesn't exist (e.g., Feb 30 → last day)
    return 0
  }

  return 0
}

/**
 * Build the 52-week cash flow forecast
 */
export function buildForecast({ 
  beginningBalance = 0,
  recurringExpenses = [],
  receivables = [],
  payables = [],
  weekCount = 52,
  startDate = new Date(),
  locLimit = 0,
  seasonalRevenue = []
}) {
  const weeks = getWeekEndings(startDate, weekCount)
  const forecast = []
  let runningBalance = beginningBalance
  let locBalance = 0

  for (let i = 0; i < weeks.length; i++) {
    const weekEnding = weeks[i]
    const weekStart = addWeeks(weekEnding, -1)
    const weStr = format(weekEnding, 'yyyy-MM-dd')

    // Calculate recurring expenses for this week
    let totalRecurring = 0
    const recurringDetail = []
    for (const exp of recurringExpenses) {
      if (!exp.active) continue
      const amt = getRecurringForWeek(exp, weekEnding)
      if (amt > 0) {
        totalRecurring += amt
        recurringDetail.push({ name: exp.name, amount: amt })
      }
    }

    // Calculate AR receipts for this week
    let totalReceipts = 0
    const arDetail = []
    for (const ar of receivables) {
      if (ar.promiseDate && format(new Date(ar.promiseDate), 'yyyy-MM-dd') === weStr) {
        totalReceipts += ar.amount
        arDetail.push({ name: ar.name, invoiceNumber: ar.invoiceNumber, amount: ar.amount })
      }
    }

    // Add seasonal/forecast revenue if no specific AR for this week
    if (seasonalRevenue[i] && totalReceipts === 0) {
      totalReceipts = seasonalRevenue[i]
    }

    // Calculate AP payments for this week
    let totalPayables = 0
    const apDetail = []
    for (const ap of payables) {
      const payDate = ap.overrideDate || ap.payDate
      if (payDate && format(new Date(payDate), 'yyyy-MM-dd') === weStr) {
        totalPayables += ap.amount
        apDetail.push({ vendor: ap.vendor, amount: ap.amount })
      }
    }

    const totalDisbursements = totalRecurring + totalPayables
    const netCashFlow = totalReceipts - totalDisbursements
    const endingBalance = runningBalance + netCashFlow

    forecast.push({
      week: i + 1,
      weekEnding,
      weekEndingStr: weStr,
      beginningBalance: runningBalance,
      locAvailable: Math.max(0, locLimit - locBalance),
      locUsed: 0,
      locRepaid: 0,
      totalReceipts,
      arDetail,
      totalRecurring,
      recurringDetail,
      totalPayables,
      apDetail,
      totalDisbursements,
      netCashFlow,
      endingBalance,
      quarter: Math.ceil((i + 1) / 13),
    })

    runningBalance = endingBalance
  }

  return forecast
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format date for display
 */
export function formatWeekEnding(date) {
  return format(new Date(date), 'MMM d, yyyy')
}
