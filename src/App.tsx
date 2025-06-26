import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { FinanceProvider } from './contexts/FinanceContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AuthGuard from './components/auth/AuthGuard'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Accounts from './pages/Accounts'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard>
          <FinanceProvider>
            <Router>
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transacoes" element={<Transactions />} />
                    <Route path="/contas" element={<Accounts />} />
                    <Route path="/relatorios" element={<Reports />} />
                    <Route path="/configuracoes" element={<Settings />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            </Router>
          </FinanceProvider>
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App