import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { defaultSchoolProfile, loadSchoolProfile } from '../lib/schoolProfile'

interface NavItem {
  path: string
  label: string
  icon: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

interface DashboardLayoutProps {
  role: 'admin' | 'guru' | 'siswa'
  userName: string
  navSections: NavSection[]
  children: React.ReactNode
}

export default function DashboardLayout({ role, userName, navSections, children }: DashboardLayoutProps) {
  const themeStorageKey = `siakad_theme_${role}`
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem(themeStorageKey) || 'light')
  const [profile, setProfile] = useState(defaultSchoolProfile)
  const sidebarRef = useRef<HTMLElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    localStorage.removeItem('siakad_user')
    navigate('/login')
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(themeStorageKey, next)
    document.documentElement.dataset.theme = next
  }

  const preserveSidebarScroll = () => {
    if (sidebarRef.current) {
      sessionStorage.setItem(`siakad_sidebar_scroll_${role}`, String(sidebarRef.current.scrollTop))
    }
    setMobileOpen(false)
  }

  useEffect(() => {
    loadSchoolProfile().then(setProfile).catch(() => undefined)
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem(themeStorageKey) || 'light'
    setTheme(savedTheme)
    document.documentElement.dataset.theme = savedTheme

    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [themeStorageKey])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const savedScroll = Number(sessionStorage.getItem(`siakad_sidebar_scroll_${role}`) || 0)
    if (sidebarRef.current) sidebarRef.current.scrollTop = savedScroll
  }, [location.pathname, role])

  const roleLabels = { admin: 'Administrator', guru: 'Guru', siswa: 'Siswa' }

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="d-lg-none position-fixed top-0 start-0 end-0 bottom-0" 
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside ref={sidebarRef} className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <img src={profile.logoUrl} alt="Logo" />
          <div>
            <div className="brand-text">SIAKAD</div>
            <small style={{ color: '#94A3B8', fontSize: '0.7rem' }}>{profile.namaAplikasi}</small>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="name">{userName}</div>
            <div className="role">{roleLabels[role]}</div>
          </div>
        </div>

        <div className="sidebar-nav">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <div className="nav-section">{section.title}</div>
              )}
              {section.items.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={preserveSidebarScroll}
                >
                  <i className={`bi ${item.icon}`}></i>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-link w-100 text-start border-0 bg-transparent">
            <i className="bi bi-box-arrow-left"></i>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <button 
            className="btn btn-link text-dark d-lg-none p-0 me-3"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <i className="bi bi-list fs-4"></i>
          </button>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to={`/${role}/dashboard`} style={{ color: 'var(--inst-accent)' }}>Dashboard</Link>
              </li>
              <li className="breadcrumb-item active">{location.pathname.split('/').pop()?.replace('-', ' ')}</li>
            </ol>
          </nav>
          <div />
          <button className="btn btn-sm btn-outline-secondary theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>
            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`}></i>
          </button>
        </header>

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  )
}
