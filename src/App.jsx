import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import RecurringExpenses from './pages/RecurringExpenses'
import Receivables from './pages/Receivables'
import Payables from './pages/Payables'
import CashForecast from './pages/CashForecast'
import Setup from './pages/Setup'
import { CompanyProvider, useCompany } from './hooks/useCompany'

function AppRoutes() {
  const { company } = useCompany()
  
  if (!company) {
    return <Setup />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recurring" element={<RecurringExpenses />} />
        <Route path="/receivables" element={<Receivables />} />
        <Route path="/payables" element={<Payables />} />
        <Route path="/forecast" element={<CashForecast />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <CompanyProvider>
      <Router>
        <AppRoutes />
      </Router>
    </CompanyProvider>
  )
}
