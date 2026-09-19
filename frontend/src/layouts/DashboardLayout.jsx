import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, BarChart2, LogOut, Menu, X, GraduationCap, ChevronRight, Shield
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './DashboardLayout.css'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics',  icon: BarChart2,       label: 'Analytics' },
  { to: '/admin',      icon: Shield,          label: 'Admin Hub', adminOnly: true },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          {sidebarOpen && (
            <div className="sidebar-brand">
              <div className="brand-icon">
                <GraduationCap size={18} />
              </div>
              <div className="brand-text">
                <span className="brand-name">StudyAI</span>
                <span className="brand-tagline">Companion</span>
              </div>
            </div>
          )}
          <button className="btn btn-ghost btn-icon sidebar-toggle" onClick={() => setSidebarOpen(v => !v)} title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems
            .filter(item => !item.adminOnly || user?.role === 'ADMIN')
            .map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} className="nav-icon" />
              {sidebarOpen && <span className="nav-label">{label}</span>}
              {sidebarOpen && <ChevronRight size={14} className="nav-arrow" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-card">
              <div className="user-avatar">{user?.fullName?.[0]?.toUpperCase() ?? 'U'}</div>
              <div className="user-info">
                <span className="user-name truncate">{user?.fullName}</span>
                <span className="user-email truncate">{user?.email}</span>
              </div>
            </div>
          )}
          <button className="btn btn-ghost btn-icon logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main — keyed by route for CSS transition */}
      <main className="main-content">
        <div key={location.pathname} className="page-transition-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
