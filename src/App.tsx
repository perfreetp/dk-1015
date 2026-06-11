import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Endoscope from './pages/Endoscope'
import Patient from './pages/Patient'
import Cleaning from './pages/Cleaning'
import Equipment from './pages/Equipment'
import QCInspection from './pages/QCInspection'
import Traceability from './pages/Traceability'
import Reports from './pages/Reports'
import Layout from './components/Layout'

interface User {
  id: number
  username: string
  name: string
  role: 'nurse' | 'cleaner' | 'qc'
}

function App() {
  const [user, setUser] = useState<User | null>(null)

  const handleLogin = (loginUser: User) => {
    setUser(loginUser)
  }

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/" element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="endoscope" element={<Endoscope user={user!} />} />
        <Route path="patient" element={<Patient />} />
        <Route path="cleaning" element={<Cleaning user={user!} />} />
        <Route path="equipment" element={<Equipment user={user!} />} />
        <Route path="qc-inspection" element={<QCInspection user={user!} />} />
        <Route path="traceability" element={<Traceability user={user!} />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App
