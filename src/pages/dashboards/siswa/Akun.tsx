import { useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { changeOwnPassword } from '../../../lib/api'
import { getCurrentUser } from '../../../lib/schoolData'

const navSections = [
  { items: [
    { path: '/siswa/dashboard', label: 'Dashboard', icon: 'bi-grid' },
    { path: '/siswa/akun', label: 'Akun', icon: 'bi-person-gear' },
  ] },
  {
    title: 'Akademik',
    items: [
      { path: '/siswa/jadwal', label: 'Jadwal Pelajaran', icon: 'bi-calendar-week' },
      { path: '/siswa/nilai', label: 'Riwayat Nilai', icon: 'bi-file-earmark-text' },
      { path: '/siswa/absensi', label: 'Absensi', icon: 'bi-clipboard-check' },
      { path: '/siswa/materi', label: 'Materi & Tugas', icon: 'bi-folder' },
    ]
  },
  {
    title: 'Informasi',
    items: [
      { path: '/siswa/pengumuman', label: 'Pengumuman', icon: 'bi-megaphone' },
    ]
  },
]

export default function SiswaAkun() {
  const user = getCurrentUser()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!password || !confirmation) {
      setError('Password baru dan konfirmasi wajib diisi')
      return
    }
    if (password !== confirmation) {
      setError('Konfirmasi password tidak sama')
      return
    }
    if (!user.username) {
      setError('Sesi login tidak valid. Silakan login ulang.')
      return
    }

    try {
      setSaving(true)
      const response = await changeOwnPassword({ username: user.username, role: 'siswa', password })
      setMessage(response.message)
      setPassword('')
      setConfirmation('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="siswa" userName={user.name || 'Siswa'} navSections={navSections}>
      <div className="page-header">
        <h1>Akun</h1>
        <p className="text-muted">Kelola password login Anda secara mandiri.</p>
      </div>

      <div className="card border-0 shadow-sm" style={{ maxWidth: 560 }}>
        <div className="card-body p-4">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={savePassword}>
            <div className="mb-3">
              <label className="form-label">Password Baru</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="form-label">Konfirmasi Password Baru</label>
              <input type="password" className="form-control" value={confirmation} onChange={e => setConfirmation(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <i className="bi bi-check-lg me-2"></i>{saving ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
