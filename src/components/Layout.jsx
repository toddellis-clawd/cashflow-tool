import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Repeat, ArrowDownCircle, ArrowUpCircle, TrendingUp, Settings } from 'lucide-react'
import { useCompany } from '../hooks/useCompany'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/forecast', icon: TrendingUp, label: 'Cash Forecast' },
  { to: '/recurring', icon: Repeat, label: 'Recurring Expenses' },
  { to: '/receivables', icon: ArrowDownCircle, label: 'Receivables (AR)' },
  { to: '/payables', icon: ArrowUpCircle, label: 'Payables (AP)' },
  { to: '/setup', icon: Settings, label: 'Setup' },
]

export default function Layout({ children }) {
  const { company } = useCompany()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] border-r border-[#334155] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#334155]">
          <h1 className="text-xl font-bold text-white">💰 CashFlow Pro</h1>
          {company && (
            <p className="text-sm text-[#94a3b8] mt-1 truncate">{company.name}</p>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#94a3b8] hover:bg-[#334155] hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-[#334155]">
          <p className="text-xs text-[#64748b]">360 AI Solutions</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
