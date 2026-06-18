import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { getSiswaDashboard, type SiswaDashboardData } from '../../../lib/api'
import { getCurrentUser } from '../../../lib/schoolData'

const navSections = [
  { items: [
    { path: '/siswa/dashboard', label: 'Dashboard', icon: 'bi-grid' },
    { path: '/siswa/akun', label: 'Akun', icon: 'bi-person-gear' },
  ] },
  { title: 'Akademik', items: [
    { path: '/siswa/jadwal', label: 'Jadwal Pelajaran', icon: 'bi-calendar-week' },
    { path: '/siswa/nilai', label: 'Riwayat Nilai', icon: 'bi-file-earmark-text' },
    { path: '/siswa/absensi', label: 'Absensi', icon: 'bi-clipboard-check' },
    { path: '/siswa/materi', label: 'Materi & Tugas', icon: 'bi-folder' },
  ]},
  { title: 'Informasi', items: [
    { path: '/siswa/pengumuman', label: 'Pengumuman', icon: 'bi-megaphone' },
  ]},
]

export default function SiswaPengumuman() {
  const user = getCurrentUser()
  const [dashboard, setDashboard] = useState<SiswaDashboardData | null>(null)
  const [error, setError] = useState('')
  const siswa = dashboard?.siswa
  const pengumumanData = dashboard?.pengumumanTerbaru || []

  useEffect(() => {
    if (!user.username) return

    getSiswaDashboard(user.username)
      .then(data => {
        setDashboard(data)
        setError('')
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Gagal memuat pengumuman dari database')
      })
  }, [user.username])

  return (
    <DashboardLayout role="siswa" userName={siswa?.nama || user.name || 'Siswa'} navSections={navSections}>
      <div className="page-header">
        <h1>Pengumuman</h1>
        <p className="text-muted">Informasi terkini dari admin, guru, materi, dan tugas kelas Anda</p>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}. Data cadangan ditampilkan.
        </div>
      )}

      <div className="row g-3">
        {pengumumanData.map((p, idx) => (
          <div className="col-12" key={`${p.judul}-${idx}`}>
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    {p.penting && <span className="badge bg-danger">Penting</span>}
                    <span className="badge bg-info">{p.kategori || 'Informasi'}</span>
                    {p.sumber && <span className="badge bg-secondary">{p.sumber}</span>}
                  </div>
                  <small className="text-muted">
                    <i className="bi bi-calendar3 me-1"></i>
                    {p.waktu}
                  </small>
                </div>
                <h6 className="mb-2">{p.judul}</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{p.isi || 'Detail informasi belum tersedia.'}</p>
              </div>
            </div>
          </div>
        ))}
        {pengumumanData.length === 0 && (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5 text-muted">Belum ada pengumuman, materi, atau tugas baru.</div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
