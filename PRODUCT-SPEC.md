# CashFlow Pro — Product Specification
## 360 AI Solutions Product

**Tagline:** Weekly cash flow forecasting for small business owners who can't afford surprises.

**Origin:** Based on the CCM/CFM v2.0 Excel workbook — a battle-tested cash flow management system, converted into a modern multi-tenant SaaS app.

---

## Core Value Proposition

Small business owners need to know: **"Will I have enough cash next week? Next month? Next quarter?"**

Most can't answer that question without staring at spreadsheets for hours. CashFlow Pro answers it in seconds.

---

## Target Users

- Small business owners (1-50 employees)
- Bookkeepers / office managers
- Fractional CFOs / consultants (white-label opportunity)
- Moving companies, contractors, service businesses (seasonal revenue)

---

## Core Modules

### 1. Company Setup & Dashboard
- Company name, fiscal year start
- Beginning cash balance
- Line of Credit setup (name, max limit, draw/repay tracking)
- **Dashboard:** Rolling 52-week cash position chart, current week snapshot, alerts

### 2. Revenue Forecasting (Seasonality Engine)
- Enter 1-5 years of monthly historical sales
- System calculates seasonal percentages by month
- Projects weekly revenue based on seasonal pattern + growth target
- Override capability for known upcoming invoices
- Confidence weighting (user sets % confidence per week, adjusts forecast)

### 3. Accounts Receivable Tracker
- Import or manually enter open invoices (Name, Invoice #, Date, Amount)
- Set expected receive/promise dates per invoice
- Invoices auto-place into weekly cash receipt forecast
- "Advance Week" workflow: carry forward unpaid items
- Collections management: voicemail date, promise date, flags, cumulative notes
- Grace period settings (days after voicemail, days after promise)
- Payment terms configuration

### 4. Accounts Payable Tracker
- Import or manually enter open bills (Vendor, Invoice #, Date, Amount)
- Set planned pay dates (with override capability)
- Bills auto-place into weekly cash disbursement forecast
- COGS % tracking on predictive AR

### 5. Recurring Expense Engine
- Add recurring expenses with:
  - Name (e.g., "Payroll", "Rent", "Insurance")
  - Frequency: Weekly (w), Bi-weekly (b), Monthly (m)
  - Day of month (for monthly) or pay schedule (for bi-weekly)
  - Amount
- Payroll sub-engine:
  - Weekly payroll amount (auto-distributes to every week)
  - Bi-weekly payroll with configurable pay dates
  - Up to 10 payroll lines
- Skip/exception management (skip individual scheduled payments)
- Auto-calculates which weeks each expense falls into

### 6. Cash Flow Forecast (The Money View)
- **52-week rolling forecast** broken into quarterly views
- For each week shows:
  - (A) Beginning Cash Balance
  - Line of Credit available / used / repaid
  - (B) Cash Receipts: AR collections + forecast receivables
  - (C) Cash Disbursements: AP payments + recurring expenses
  - (D) Ending Cash = A + B - C
- Period summary columns (quarterly totals)

### 7. Analytics & Tracking
- **ADGL** (Average Daily Gross Labor): baseline, goal, weekly actuals, trend
- **% Good Money**: Track what % of invoiced revenue actually gets collected
- **Confidence %**: Weight forecast accuracy by week distance
- **Sales Trend Analysis**: Year-over-year growth rates, cumulative forecast vs actual

### 8. Data Import
- CSV import for AR/AP (from QuickBooks, Xero, etc.)
- Flexible column mapping
- Import validation & error logging

---

## Weekly Workflow

1. **Start of week:** Click "Advance Week" → system rolls forward
2. **Import/update AR:** Upload new open invoices from accounting system
3. **Import/update AP:** Upload new open bills
4. **Review forecast:** Dashboard shows updated 52-week cash position
5. **Adjust:** Move AP payment dates if cash is tight, update AR promise dates
6. **Act:** Collections follow-up on flagged items, decide LOC draws

---

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS (dark theme)
- **Backend/DB:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Hosting:** Vercel
- **Multi-tenant:** Each company is isolated via Supabase RLS
- **Auth:** Supabase Auth (email/password, magic link)

---

## Data Model (Key Tables)

```
companies
  id, name, fiscal_year_start, beginning_balance, created_by

line_of_credit
  id, company_id, name, max_limit

historical_sales
  id, company_id, year, month, amount

recurring_expenses
  id, company_id, name, frequency (w/b/m), day, amount, is_payroll

recurring_skips
  id, recurring_expense_id, week_ending_date

receivables
  id, company_id, name, invoice_number, invoice_date, amount,
  promise_date, receive_date, voicemail_date, status, notes

payables
  id, company_id, vendor, invoice_number, invoice_date, amount,
  pay_date, override_date, status

weekly_snapshots
  id, company_id, week_ending, beginning_balance, loc_available,
  loc_used, loc_repaid, total_receipts, total_disbursements,
  ending_balance, confidence_pct

seasonality_config
  id, company_id, avg_payment_terms_days, growth_target
```

---

## MVP Scope (Phase 1)

1. Company setup + beginning balance
2. Recurring expense engine (weekly/bi-weekly/monthly with payroll)
3. Manual AR/AP entry with date scheduling
4. 52-week cash flow forecast view
5. Dashboard with cash position chart
6. Supabase auth + multi-tenant

## Phase 2
- Seasonality engine (historical sales → forecast)
- CSV import for AR/AP
- Confidence weighting
- Collections management (flags, notes, voicemail tracking)
- ADGL & % Good Money analytics

## Phase 3
- QuickBooks/Xero API integration
- White-label for consultants
- PDF report export
- Email alerts (cash dips below threshold)

---

## Pricing (Draft)

| Tier | Price | Features |
|------|-------|----------|
| Starter | $49/mo | 1 company, manual entry, 13-week forecast |
| Pro | $99/mo | 1 company, CSV import, 52-week forecast, analytics |
| Consultant | $199/mo | 5 companies, white-label, all features |
| Enterprise | Custom | Unlimited companies, API access, integrations |

---

## Competitive Landscape

| Tool | Price | Gap We Fill |
|------|-------|-------------|
| Float | $59-199/mo | Complex, designed for accountants not owners |
| Pulse | $29-89/mo | Basic, no seasonality, no collections |
| Dryrun | $99-399/mo | Expensive, over-engineered |
| Excel | Free | No multi-user, no automation, macro hell |
| **CashFlow Pro** | $49-199/mo | Purpose-built for SMB owners, weekly granularity, seasonal forecasting |
