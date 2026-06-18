interface CRUDDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: 'default' | 'wide'
  children: React.ReactNode
}

export default function CRUDDrawer({ isOpen, onClose, title, size = 'default', children }: CRUDDrawerProps) {
  return (
    <>
      {isOpen && (
        <div className="drawer-overlay" onClick={onClose} />
      )}
      <div className={`drawer-panel ${isOpen ? 'open' : ''}`} style={size === 'wide' ? { width: 'min(960px, 92vw)' } : undefined}>
        <div className="drawer-header">
          <h5>{title}</h5>
          <button className="btn btn-link p-0 text-secondary" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="drawer-body">
          {children}
        </div>
      </div>
    </>
  )
}
