import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { Link } from 'react-router-dom'
import { getAdminDashboard } from '../../../lib/api'
import { formatActivityTime, getActivities, readStored, type ActivityItem } from '../../../lib/frontendActions'
import { defaultSchoolProfile, loadSchoolProfile } from '../../../lib/schoolProfile'

interface GuruData {
  nip: string
  nama: string
  mapel: string
  jk: string
  status: string
}

interface KelasData {
  nama: string
  wali: string
  jmlSiswa: number
  kapasitas: number
  ruang: string
}

interface MapelData {
  kode: string
  nama: string
  kelompok: string
  kelas: string
  jpm: number
}

const defaultGuru: GuruData[] = [
  { nip: '196805152000121002', nama: 'Drs. Hadi Wijaya, M.Pd.', mapel: 'Matematika', jk: 'Laki-laki', status: 'Aktif' },
  { nip: '197203201998032005', nama: 'Dra. Siti Aminah, M.Pd.', mapel: 'Bahasa Indonesia', jk: 'Perempuan', status: 'Aktif' },
  { nip: '198001102005012003', nama: 'Dra. Rina Marlina, M.Pd.', mapel: 'Biologi', jk: 'Perempuan', status: 'Aktif' },
]

const defaultKelas: KelasData[] = [
  { nama: 'X IPA 1', wali: 'Drs. Hadi Wijaya, M.Pd.', jmlSiswa: 32, kapasitas: 32, ruang: 'R-101' },
  { nama: 'X IPA 2', wali: 'Dra. Siti Aminah, M.Pd.', jmlSiswa: 30, kapasitas: 32, ruang: 'R-102' },
  { nama: 'X IPS 1', wali: 'Dra. Rina Marlina, M.Pd.', jmlSiswa: 31, kapasitas: 32, ruang: 'R-103' },
  { nama: 'X IPS 2', wali: 'Drs. Agus Pratama, M.Pd.', jmlSiswa: 28, kapasitas: 32, ruang: 'R-104' },
  { nama: 'XI IPA 1', wali: 'S.Pd. Budi Hartono', jmlSiswa: 32, kapasitas: 32, ruang: 'R-201' },
  { nama: 'XI IPA 2', wali: 'Dra. Maya Sari, M.Pd.', jmlSiswa: 29, kapasitas: 32, ruang: 'R-202' },
  { nama: 'XI IPS 1', wali: 'S.Pd. Andi Wijaya', jmlSiswa: 30, kapasitas: 32, ruang: 'R-203' },
  { nama: 'XI IPS 2', wali: 'Drs. Slamet Riyadi, M.Pd.', jmlSiswa: 31, kapasitas: 32, ruang: 'R-204' },
  { nama: 'XII IPA 1', wali: 'S.Pd. Dedi Kurniawan', jmlSiswa: 32, kapasitas: 32, ruang: 'R-301' },
  { nama: 'XII IPS 1', wali: 'S.Pd. Nurul Hidayah', jmlSiswa: 30, kapasitas: 32, ruang: 'R-302' },
]

const defaultMapel: MapelData[] = [
  { kode: 'MTK', nama: 'Matematika', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'BIND', nama: 'Bahasa Indonesia', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'BING', nama: 'Bahasa Inggris', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'FIS', nama: 'Fisika', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'KIM', nama: 'Kimia', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'BIO', nama: 'Biologi', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'SEJ', nama: 'Sejarah', kelompok: 'A', kelas: 'X, XI, XII', jpm: 3 },
  { kode: 'PAI', nama: 'Pendidikan Agama Islam', kelompok: 'A', kelas: 'X, XI, XII', jpm: 2 },
  { kode: 'PPKn', nama: 'PPKn', kelompok: 'A', kelas: 'X, XI, XII', jpm: 2 },
  { kode: 'PJOK', nama: 'Penjasorkes', kelompok: 'B', kelas: 'X, XI, XII', jpm: 3 },
  { kode: 'SBK', nama: 'Seni Budaya', kelompok: 'B', kelas: 'X, XI, XII', jpm: 2 },
  { kode: 'TIK', nama: 'Teknologi Informasi', kelompok: 'B', kelas: 'X, XI, XII', jpm: 2 },
  { kode: 'BK', nama: 'Bimbingan Konseling', kelompok: 'B', kelas: 'X, XI, XII', jpm: 1 },
]

export default function AdminDashboard() {
  const [totalSiswa, setTotalSiswa] = useState(0)
  const [totalGuru, setTotalGuru] = useState(() => readStored<GuruData[]>('siakad_guru', defaultGuru).length)
  const [totalKelas, setTotalKelas] = useState(() => readStored<KelasData[]>('siakad_kelas', defaultKelas).length)
  const [totalMapel, setTotalMapel] = useState(() => readStored<MapelData[]>('siakad_mapel', defaultMapel).length)
  const [activities, setActivities] = useState<ActivityItem[]>(() => getActivities())
  const [dashboardError, setDashboardError] = useState('')
  const [profile, setProfile] = useState(defaultSchoolProfile)

  const refreshStats = async () => {
    setActivities(getActivities())

    try {
      const dashboard = await getAdminDashboard()
      setTotalSiswa(dashboard.totalSiswa)
      setTotalGuru(dashboard.totalGuru)
      setTotalKelas(dashboard.totalKelas)
      setTotalMapel(dashboard.totalMapel)
      setDashboardError('')
    } catch {
      setTotalSiswa(readStored('siakad_siswa', []).length)
      setTotalGuru(readStored<GuruData[]>('siakad_guru', defaultGuru).length)
      setTotalKelas(readStored<KelasData[]>('siakad_kelas', defaultKelas).length)
      setTotalMapel(readStored<MapelData[]>('siakad_mapel', defaultMapel).length)
      setDashboardError('Dashboard memakai data lokal karena API database belum tersambung.')
    }
  }

  useEffect(() => {
    loadSchoolProfile().then(setProfile).catch(() => undefined)
    void Promise.resolve().then(refreshStats)

    window.addEventListener('focus', refreshStats)
    window.addEventListener('storage', refreshStats)

    return () => {
      window.removeEventListener('focus', refreshStats)
      window.removeEventListener('storage', refreshStats)
    }
  }, [])

  const stats = [
    { label: 'Total Siswa', value: totalSiswa.toLocaleString('id-ID'), icon: 'bi-people', color: 'blue', change: 'Data Kelola Siswa' },
    { label: 'Total Guru', value: totalGuru.toLocaleString('id-ID'), icon: 'bi-person-badge', color: 'green', change: 'Data Kelola Guru' },
    { label: 'Kelas Aktif', value: totalKelas.toLocaleString('id-ID'), icon: 'bi-building', color: 'orange', change: 'Data Kelola Kelas' },
    { label: 'Mata Pelajaran', value: totalMapel.toLocaleString('id-ID'), icon: 'bi-book', color: 'red', change: 'Data Mata Pelajaran' },
  ]

  const fallbackActivity = [
    { action: 'Data siswa baru ditambahkan', detail: '5 siswa kelas X IPA 1', time: '10 menit lalu', icon: 'bi-person-plus' },
    { action: 'Jadwal diperbarui', detail: 'Jadwal kelas XII IPS 2', time: '30 menit lalu', icon: 'bi-calendar-check' },
    { action: 'Pengumuman dipublikasikan', detail: 'Pengumuman PTS 2026', time: '1 jam lalu', icon: 'bi-megaphone' },
    { action: 'Nilai diinput', detail: 'Matematika - Kelas X', time: '2 jam lalu', icon: 'bi-file-earmark-text' },
    { action: 'Absensi diperbarui', detail: 'Kelas XI IPA 1 - 15 Jan', time: '3 jam lalu', icon: 'bi-clipboard-check' },
  ]

  const recentActivity = activities.length > 0
    ? activities.slice(0, 5).map(item => ({
      action: item.action,
      detail: item.detail,
      time: formatActivityTime(item.createdAt),
      icon: item.icon,
    }))
    : fallbackActivity

  const navSections = [
    {
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-grid' },
      ]
    },
    {
      title: 'Data Master',
      items: [
        { path: '/admin/siswa', label: 'Kelola Siswa', icon: 'bi-people' },
        { path: '/admin/guru', label: 'Kelola Guru', icon: 'bi-person-badge' },
        { path: '/admin/kelas', label: 'Kelola Kelas', icon: 'bi-building' },
        { path: '/admin/mapel', label: 'Mata Pelajaran', icon: 'bi-book' },
        { path: '/admin/prestasi', label: 'Kelola Prestasi', icon: 'bi-trophy' },
        { path: '/admin/ekstrakurikuler', label: 'Kelola Ekstrakurikuler', icon: 'bi-stars' },
        { path: '/admin/jadwal', label: 'Kelola Jadwal', icon: 'bi-calendar-week' },
        { path: '/admin/tahun-ajaran', label: 'Tahun Ajaran', icon: 'bi-calendar-event' },
      ]
    },
    {
      title: 'Pengaturan',
      items: [
        { path: '/admin/pengumuman', label: 'Pengumuman', icon: 'bi-megaphone' },
        { path: '/admin/laporan', label: 'Laporan & Ekspor', icon: 'bi-file-earmark-bar-graph' },
        { path: '/admin/arsip', label: 'Arsip', icon: 'bi-archive' },
        { path: '/admin/pengaturan', label: 'Pengaturan Sistem', icon: 'bi-gear' },
      ]
    },
  ]

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header">
        <h1>Dashboard Admin</h1>
        <p className="text-muted">Ringkasan data akademik {profile.namaAplikasi}</p>
      </div>

      {dashboardError && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>{dashboardError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {stats.map((stat, idx) => (
          <div className="col-md-6 col-xl-3" key={idx}>
            <div className="stat-card">
              <div className={`stat-icon ${stat.color}`}>
                <i className={`bi ${stat.icon} fs-4`}></i>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <small className="text-success" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-arrow-up-short"></i>
                {stat.change}
              </small>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Recent Activity */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Aktivitas Terbaru</h6>
              <button className="btn btn-sm btn-link text-primary" onClick={refreshStats}>Refresh</button>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {recentActivity.map((item, idx) => (
                  <div className="list-group-item d-flex gap-3 align-items-center py-3" key={idx}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 40, height: 40, background: 'rgba(59,110,255,0.1)', minWidth: 40 }}>
                      <i className={`bi ${item.icon} text-primary`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0" style={{ fontSize: '0.875rem' }}>{item.action}</h6>
                      <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{item.detail}</p>
                    </div>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{item.time}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">Aksi Cepat</h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {[
                  { label: 'Tambah Data Siswa', icon: 'bi-person-plus', path: '/admin/siswa' },
                  { label: 'Tambah Data Guru', icon: 'bi-person-badge', path: '/admin/guru' },
                  { label: 'Buat Pengumuman', icon: 'bi-megaphone', path: '/admin/pengumuman' },
                  { label: 'Atur Jadwal', icon: 'bi-calendar-plus', path: '/admin/jadwal' },
                  { label: 'Generate Laporan', icon: 'bi-file-earmark-pdf', path: '/admin/laporan' },
                ].map((action, idx) => (
                  <Link to={action.path} className="btn btn-outline-primary d-flex align-items-center gap-2 text-start" key={idx}>
                    <i className={`bi ${action.icon}`}></i>
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
