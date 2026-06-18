import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { getJadwal, type JadwalData } from '../../../lib/api'
import { getCurrentUser } from '../../../lib/schoolData'

const navSections = [
  { items: [
    { path: '/guru/dashboard', label: 'Dashboard', icon: 'bi-grid' },
    { path: '/guru/akun', label: 'Akun', icon: 'bi-person-gear' },
  ] },
  { title: 'Mengajar', items: [
    { path: '/guru/materi', label: 'Materi & Tugas', icon: 'bi-folder-plus' },
    { path: '/guru/jadwal', label: 'Jadwal Mengajar', icon: 'bi-calendar-week' },
    { path: '/guru/nilai', label: 'Input Nilai', icon: 'bi-file-earmark-text' },
    { path: '/guru/absensi', label: 'Input Absensi', icon: 'bi-clipboard-check' },
  ]},
]

const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
export default function GuruJadwal() {
  const user = getCurrentUser()
  const [jadwalData, setJadwalData] = useState<JadwalData[]>([])
  const [error, setError] = useState('')
  const now = new Date()
  const currentDay = now.toLocaleDateString('id-ID', { weekday: 'long' })
  const currentDate = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user.username) return
    getJadwal({ guruNip: user.username })
      .then(data => {
        setJadwalData(data)
        setError('')
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Gagal memuat jadwal mengajar'))
  }, [user.username])

  return (
    <DashboardLayout role="guru" userName={user.name || 'Guru'} navSections={navSections}>
      <div className="page-header">
        <h1>Jadwal Mengajar</h1>
        <p className="text-muted">Jadwal mengajar real-time untuk {currentDay}, {currentDate}</p>
      </div>

      {error && <div className="alert alert-warning"><i className="bi bi-exclamation-triangle me-2"></i>{error}</div>}

      {[currentDay, ...hari.filter(h => h !== currentDay)].map(h => {
        const jadwalHari = jadwalData.filter(j => j.hari === h)
        return (
          <div className="card border-0 shadow-sm mb-3" key={h}>
            <div className="card-header bg-white">
              <h6 className="mb-0">{h}{h === currentDay && <span className="badge bg-primary ms-2">Hari ini</span>}</h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead><tr><th>Jam</th><th>Kelas</th><th>Mata Pelajaran</th><th>Ruang</th></tr></thead>
                  <tbody>
                    {jadwalHari.map((j, idx) => (
                      <tr key={idx}>
                        <td>{j.jam}</td>
                        <td><span className="badge bg-primary bg-opacity-10 text-primary">{j.kelas}</span></td>
                        <td>{j.mapel}</td>
                        <td><i className="bi bi-geo-alt me-1 text-muted"></i>{j.ruang}</td>
                      </tr>
                    ))}
                    {jadwalHari.length === 0 && <tr><td colSpan={4} className="text-muted py-3">Belum ada jadwal mengajar.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })}
    </DashboardLayout>
  )
}
