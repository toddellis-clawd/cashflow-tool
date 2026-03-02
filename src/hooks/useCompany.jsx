import { createContext, useContext, useState, useEffect } from 'react'

const CompanyContext = createContext(null)

const STORAGE_KEY = 'cashflow_company'

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (company) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(company))
    }
  }, [company])

  const updateCompany = (data) => {
    setCompany(prev => ({ ...prev, ...data }))
  }

  const resetCompany = () => {
    localStorage.removeItem(STORAGE_KEY)
    setCompany(null)
  }

  return (
    <CompanyContext.Provider value={{ company, setCompany, updateCompany, resetCompany }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider')
  return ctx
}
