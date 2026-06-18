interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
}

export default function DeleteModal({ isOpen, onClose, onConfirm, title = 'Konfirmasi Hapus', message = 'Apakah Anda yakin ingin menghapus data ini?' }: DeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal fade show d-block delete-modal" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body text-center p-4">
            <div className="mb-3">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: 64, height: 64, background: 'rgba(239,68,68,0.1)' }}>
                <i className="bi bi-exclamation-triangle-fill text-danger fs-2"></i>
              </div>
            </div>
            <h5 className="mb-2">{title}</h5>
            <p className="text-muted mb-4">{message}</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary px-4" onClick={onClose}>Batal</button>
              <button className="btn btn-danger px-4" onClick={onConfirm}>Hapus</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
