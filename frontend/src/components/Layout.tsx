import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, List, Server, GitBranch, Plus, Activity, Zap } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/jobs', label: 'Jobs', icon: List },
  { to: '/workers', label: 'Workers', icon: Server },
  { to: '/queues', label: 'Queues', icon: GitBranch },
]

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Zap size={20} className="brand-icon" />
          <span className="brand-name">TaskForge</span>
          <span className="brand-tag">v1.0</span>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => clsx('nav-item', isActive && 'active')}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/jobs/create" className="create-btn">
            <Plus size={14} />
            <span>New Job</span>
          </NavLink>
          <div className="status-dot-row">
            <span className="dot green" />
            <span className="status-text">System Online</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
