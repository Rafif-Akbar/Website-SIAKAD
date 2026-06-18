import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { getSiswaDashboard, type SiswaDashboardData } from '../../../lib/api'
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

export default function SiswaDashboard() {
  const user = getCurrentUser()
  const [dashboard, setDashboard] = useState<SiswaDashboardData | null>(null)
  const [error, setError] = useState('')
  const siswa = dashboard?.siswa
  const displayName = siswa?.nama || user.name || 'Siswa'
  const schedule = dashboard?.jadwalHariIni || []
  const nilai = dashboard?.ringkasanNilai || []
  const pengumuman = dashboard?.pengumumanTerbaru || []
  const absensi = dashboard?.absensi || { hadir: 0, sakit: 0, izin: 0, alpa: 0 }
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user.username) return

    getSiswaDashboard(user.username)
      .then(data => {
        setDashboard(data)
        setError('')
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Gagal memuat dashboard siswa dari database')
      })
  }, [user.username])

  return (
    <DashboardLayout role="siswa" userName={displayName} navSections={navSections}>
      <div className="page-header">
        <h1>Dashboard Siswa</h1>
        <p className="text-muted">Selamat datang di portal akademik, {displayName}!</p>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}. Data cadangan ditampilkan.
        </div>
      )}

      <div className="row g-4">
        {/* Schedule Today */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h6 className="mb-0"><i className="bi bi-calendar-day me-2 text-primary"></i>Jadwal Hari Ini - {todayLabel}</h6>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {schedule.map((j, idx) => (
                  <div className="list-group-item d-flex gap-3 align-items-center py-3" key={idx}>
                    <div className="text-center" style={{ minWidth: 110 }}>
                      <small className="text-muted d-block">{j.jam}</small>
                    </div>
                    <div className="flex-grow-1">
                      {j.mapel === 'Istirahat' ? (
                        <span className="text-muted"><i className="bi bi-cup-hot me-2"></i>Istirahat</span>
                      ) : (
                        <>
                          <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>{j.mapel}</h6>
                          <small className="text-muted">{j.guru} | {j.ruang}</small>
                        </>
                      )}
                    </div>
                    {j.status !== '-' && (
                      <span className={`badge ${
                        j.status === 'Selesai' ? 'bg-success' :
                        j.status === 'Sedang Berlangsung' ? 'bg-warning text-dark' : 'bg-primary'
                      }`} style={{ fontSize: '0.7rem' }}>{j.status}</span>
                    )}
                  </div>
                ))}
                {schedule.length === 0 && (
                  <div className="list-group-item py-4 text-center text-muted">
                    Belum ada jadwal untuk hari ini.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grade Summary */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0"><i className="bi bi-file-earmark-text me-2 text-success"></i>Ringkasan Nilai Semester Genap</h6>
              <a href="/siswa/nilai" className="btn btn-sm btn-link text-primary">Lihat Detail</a>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead><tr><th>Mapel</th><th className="text-center">NH</th><th className="text-center">Tugas</th><th className="text-center">PTS</th><th className="text-center">NA</th></tr></thead>
                  <tbody>
                    {nilai.map((n, idx) => (
                      <tr key={idx}>
                        <td>{n.mapel}</td>
                        <td className="text-center">{n.nh}</td>
                        <td className="text-center">{n.tugas}</td>
                        <td className="text-center">{n.pts}</td>
                        <td className="text-center fw-bold text-primary">{n.na}</td>
                      </tr>
                    ))}
                    {nilai.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">Belum ada nilai yang diinput guru.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Student Info */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4 text-center">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white mb-3" style={{ width: 72, height: 72, fontSize: '1.75rem', fontWeight: 700 }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <h6 className="mb-1">{displayName}</h6>
              <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>NISN: {siswa?.nisn || user.username || '-'}</p>
              <div className="d-flex gap-2 justify-content-center">
                <span className="badge bg-primary">{siswa?.kelas || 'X IPA 1'}</span>
                <span className="badge bg-success">{siswa?.status || 'Aktif'}</span>
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h6 className="mb-0"><i className="bi bi-megaphone me-2 text-warning"></i>Pengumuman</h6>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {pengumuman.map((p, idx) => (
                  <div className="list-group-item py-3" key={idx}>
                    <div className="d-flex gap-2">
                      {p.penting && <span className="badge bg-danger">Penting</span>}
                      {p.kategori && <span className="badge bg-info">{p.kategori}</span>}
                    </div>
                    <h6 className="mb-1 mt-1" style={{ fontSize: '0.85rem' }}>{p.judul}</h6>
                    <small className="text-muted">{p.waktu}{p.sumber ? ` | ${p.sumber}` : ''}</small>
                  </div>
                ))}
                {pengumuman.length === 0 && (
                  <div className="list-group-item py-4 text-center text-muted">
                    Belum ada pengumuman.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h6 className="mb-3">Ringkasan Presensi</h6>
              <div className="d-flex justify-content-between text-center">
                <div>
                  <div className="fw-bold text-success">{absensi.hadir}</div>
                  <small className="text-muted">Hadir</small>
                </div>
                <div>
                  <div className="fw-bold text-warning">{absensi.sakit}</div>
                  <small className="text-muted">Sakit</small>
                </div>
                <div>
                  <div className="fw-bold text-info">{absensi.izin}</div>
                  <small className="text-muted">Izin</small>
                </div>
                <div>
                  <div className="fw-bold text-danger">{absensi.alpa}</div>
                  <small className="text-muted">Alpa</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
