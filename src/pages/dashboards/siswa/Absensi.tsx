import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { getAbsensiSiswa, getSiswa, type AbsensiSiswaData, type SiswaData } from '../../../lib/api'
import { readStored, store } from '../../../lib/frontendActions'
import { defaultSiswa, getCurrentUser } from '../../../lib/schoolData'

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

function formatTanggal(value: string) {
  const [year, month, day] = String(value || '').slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return value || '-'
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function SiswaAbsensi() {
  const user = getCurrentUser()
  const fallbackSiswa = readStored<SiswaData[]>('siakad_siswa', defaultSiswa).find(item => item.nisn === user.username) || {
    nisn: user.username || '',
    nama: user.name || 'Siswa',
    kelas: '-',
    jk: '-',
    status: 'Aktif',
  }
  const [siswa, setSiswa] = useState<SiswaData>(fallbackSiswa)
  const [absensiHarian, setAbsensiHarian] = useState<AbsensiSiswaData[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const loadAbsensi = () => {
    if (!user.username) return
    setLoading(true)
    getAbsensiSiswa(user.username)
      .then(setAbsensiHarian)
      .catch(() => setAbsensiHarian([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user.username) return
    getSiswa()
      .then(items => {
        const current = items.find(item => item.nisn === user.username)
        if (current) setSiswa(current)
        store('siakad_siswa', items)
      })
      .catch(() => undefined)
    loadAbsensi()
  }, [user.name, user.username])

  useEffect(() => {
    const refresh = () => loadAbsensi()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [user.username])

  const total = absensiHarian.reduce((acc, a) => ({
    hadir: acc.hadir + a.hadir,
    sakit: acc.sakit + a.sakit,
    izin: acc.izin + a.izin,
    alpa: acc.alpa + a.alpa,
  }), { hadir: 0, sakit: 0, izin: 0, alpa: 0 })

  const totalHari = total.hadir + total.sakit + total.izin + total.alpa

  const attendanceRate = totalHari ? Math.round((total.hadir / totalHari) * 100) : 0

  return (
    <DashboardLayout role="siswa" userName={siswa.nama || user.name || 'Siswa'} navSections={navSections}>
      <div className="page-header">
        <h1>Absensi</h1>
        <p className="text-muted">Rekam jejak kehadiran harian sampai {today}</p>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle text-white" style={{ width: 48, height: 48, background: 'var(--inst-success)' }}>
                <i className="bi bi-check-lg fs-4"></i>
              </div>
              <div>
                <h5 className="mb-0">{total.hadir}</h5>
                <small className="text-muted">Hadir</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle text-white" style={{ width: 48, height: 48, background: 'var(--inst-warning)' }}>
                <i className="bi bi-heart-pulse fs-4"></i>
              </div>
              <div>
                <h5 className="mb-0">{total.sakit}</h5>
                <small className="text-muted">Sakit</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle text-white" style={{ width: 48, height: 48, background: 'var(--inst-accent)' }}>
                <i className="bi bi-file-earmark-text fs-4"></i>
              </div>
              <div>
                <h5 className="mb-0">{total.izin}</h5>
                <small className="text-muted">Izin</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle text-white" style={{ width: 48, height: 48, background: 'var(--inst-danger)' }}>
                <i className="bi bi-x-lg fs-4"></i>
              </div>
              <div>
                <h5 className="mb-0">{total.alpa}</h5>
                <small className="text-muted">Alpa</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="mb-3">Tingkat Kehadiran</h6>
          <div className="d-flex align-items-center gap-3">
            <div className="flex-grow-1">
              <div className="progress" style={{ height: 24 }}>
                <div className="progress-bar bg-success" style={{ width: `${attendanceRate}%` }}>
                  {attendanceRate}%
                </div>
              </div>
            </div>
          </div>
          <p className="text-muted mt-2 mb-0">Total data absensi: {totalHari} hari</p>
        </div>
      </div>

      {/* Monthly Detail */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <h6 className="mb-0">Detail Absensi Harian</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr><th>Tanggal</th><th className="text-center">Hadir</th><th className="text-center">Sakit</th><th className="text-center">Izin</th><th className="text-center">Alpa</th><th className="text-center">Status</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="text-center text-muted py-4">Memuat data absensi...</td></tr>}
                {!loading && absensiHarian.map((a, idx) => (
                  <tr key={idx}>
                    <td>{formatTanggal(a.tanggal)}</td>
                    <td className="text-center text-success">{a.hadir}</td>
                    <td className="text-center text-warning">{a.sakit}</td>
                    <td className="text-center text-primary">{a.izin}</td>
                    <td className="text-center text-danger">{a.alpa}</td>
                    <td className="text-center fw-medium">{a.hadir ? 'Hadir' : a.sakit ? 'Sakit' : a.izin ? 'Izin' : a.alpa ? 'Alpa' : '-'}</td>
                  </tr>
                ))}
                {!loading && absensiHarian.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">Belum ada data absensi.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
