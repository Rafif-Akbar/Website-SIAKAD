import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import { addActivity, readStored, store } from '../../../lib/frontendActions'
import { deleteJadwal, getGuru, getJadwal, getKelas, getMapel as fetchMapel, upsertJadwal, type GuruData, type JadwalData } from '../../../lib/api'

const navSections = [
  { items: [{ path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-grid' }] },
  { title: 'Data Master', items: [
    { path: '/admin/siswa', label: 'Kelola Siswa', icon: 'bi-people' },
    { path: '/admin/guru', label: 'Kelola Guru', icon: 'bi-person-badge' },
    { path: '/admin/kelas', label: 'Kelola Kelas', icon: 'bi-building' },
    { path: '/admin/mapel', label: 'Mata Pelajaran', icon: 'bi-book' },
        { path: '/admin/prestasi', label: 'Kelola Prestasi', icon: 'bi-trophy' },
    { path: '/admin/ekstrakurikuler', label: 'Kelola Ekstrakurikuler', icon: 'bi-stars' },
    { path: '/admin/jadwal', label: 'Kelola Jadwal', icon: 'bi-calendar-week' },
    { path: '/admin/tahun-ajaran', label: 'Tahun Ajaran', icon: 'bi-calendar-event' },
  ]},
  { title: 'Pengaturan', items: [
    { path: '/admin/pengumuman', label: 'Pengumuman', icon: 'bi-megaphone' },
    { path: '/admin/laporan', label: 'Laporan & Ekspor', icon: 'bi-file-earmark-bar-graph' },
    { path: '/admin/arsip', label: 'Arsip', icon: 'bi-archive' },
    { path: '/admin/pengaturan', label: 'Pengaturan Sistem', icon: 'bi-gear' },
  ]},
]

const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
const jamSeninKamis = [
  { jam: '07:00 - 07:45', ke: 1 },
  { jam: '07:45 - 08:30', ke: 2 },
  { jam: '08:30 - 09:15', ke: 3 },
  { jam: '09:15 - 09:45', ke: 4 },
  { jam: '09:45 - 10:15', ke: 0, label: 'Istirahat 1' },
  { jam: '10:15 - 11:00', ke: 5 },
  { jam: '11:00 - 11:45', ke: 6 },
  { jam: '11:45 - 12:30', ke: 7 },
  { jam: '12:30 - 13:15', ke: 0, label: 'Istirahat 2' },
  { jam: '13:15 - 14:00', ke: 8 },
  { jam: '14:00 - 14:45', ke: 9 },
  { jam: '14:45 - 15:30', ke: 10 },
]
const jamJumat = [
  { jam: '07:00 - 07:45', ke: 1 },
  { jam: '07:45 - 08:30', ke: 2 },
  { jam: '08:30 - 09:15', ke: 3 },
  { jam: '09:15 - 10:00', ke: 4 },
  { jam: '10:00 - 10:45', ke: 5 },
  { jam: '10:45 - 11:15', ke: 6 },
  { jam: '11:15 - 12:45', ke: 0, label: 'Istirahat' },
]
const jamRows = ['1', '2', '3', '4', 'break-1', '5', '6', 'break-jumat', '7', 'break-2', '8', '9', '10']

function getJamPelajaran(day: string) {
  return day === 'Jumat' ? jamJumat : jamSeninKamis
}

function getJamSlot(day: string, row: string) {
  if (row === 'break-1') return day === 'Jumat' ? undefined : jamSeninKamis.find(item => item.label === 'Istirahat 1')
  if (row === 'break-2') return day === 'Jumat' ? undefined : jamSeninKamis.find(item => item.label === 'Istirahat 2')
  if (row === 'break-jumat') return day === 'Jumat' ? jamJumat.find(item => item.label === 'Istirahat') : undefined
  return getJamPelajaran(day).find(item => item.ke === Number(row))
}

const defaultJadwal: Record<string, string> = {
  'X IPA 1-Senin-1': 'Matematika', 'X IPA 1-Senin-2': 'Matematika', 'X IPA 1-Senin-3': 'Bahasa Indonesia', 'X IPA 1-Senin-4': 'Bahasa Indonesia', 'X IPA 1-Senin-5': 'Biologi',
  'X IPA 1-Senin-6': 'Biologi', 'X IPA 1-Senin-7': 'Pendidikan Agama Islam',
  'X IPA 1-Selasa-1': 'Fisika', 'X IPA 1-Selasa-2': 'Fisika', 'X IPA 1-Selasa-3': 'Bahasa Inggris', 'X IPA 1-Selasa-4': 'Bahasa Inggris', 'X IPA 1-Selasa-5': 'Sejarah',
  'X IPA 1-Selasa-6': 'Sejarah', 'X IPA 1-Selasa-7': 'Penjasorkes',
  'X IPA 1-Rabu-1': 'Kimia', 'X IPA 1-Rabu-2': 'Kimia', 'X IPA 1-Rabu-3': 'Matematika', 'X IPA 1-Rabu-4': 'Bahasa Indonesia', 'X IPA 1-Rabu-5': 'Bahasa Inggris',
  'X IPA 1-Rabu-6': 'PPKn', 'X IPA 1-Rabu-7': 'Bimbingan Konseling',
  'X IPA 1-Kamis-1': 'Matematika', 'X IPA 1-Kamis-2': 'Fisika', 'X IPA 1-Kamis-3': 'Kimia', 'X IPA 1-Kamis-4': 'Biologi', 'X IPA 1-Kamis-5': 'Bahasa Inggris',
  'X IPA 1-Kamis-6': 'Seni Budaya', 'X IPA 1-Kamis-7': 'Teknologi Informasi',
  'X IPA 1-Jumat-1': 'Bahasa Indonesia', 'X IPA 1-Jumat-2': 'Matematika', 'X IPA 1-Jumat-3': 'Pendidikan Agama Islam', 'X IPA 1-Jumat-4': 'PPKn', 'X IPA 1-Jumat-5': 'Penjasorkes',
}

interface MapelData {
  kode: string
  nama: string
  kelompok: string
  kelas: string
  jpm: number
  guru?: string
  guruNip?: string
}

interface KelasData {
  nama: string
  wali: string
  jmlSiswa: number
  kapasitas: number
  ruang: string
}

interface TahunData {
  id: string
  tahun: string
  semester: string
  status: string
  mulai: string
  selesai: string
}

type JadwalForm = { hari: string; ke: number; mapelKode: string; guruNip: string; ruang: string }

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

const defaultTahunAjaran: TahunData[] = [
  { id: '1', tahun: '2025/2026', semester: 'Genap', status: 'Aktif', mulai: '2026-01-06', selesai: '2026-06-15' },
  { id: '2', tahun: '2025/2026', semester: 'Ganjil', status: 'Selesai', mulai: '2025-07-14', selesai: '2025-12-20' },
  { id: '3', tahun: '2024/2025', semester: 'Genap', status: 'Selesai', mulai: '2025-01-06', selesai: '2025-06-14' },
]

function getMapelRows() {
  return readStored<MapelData[]>('siakad_mapel', defaultMapel)
}

function getKelasOptions() {
  return readStored<KelasData[]>('siakad_kelas', defaultKelas).map(kelas => kelas.nama)
}

function getTahunOptions() {
  return readStored<TahunData[]>('siakad_tahun_ajaran', defaultTahunAjaran)
}

function kelasLevel(kelasName: string) {
  if (/^XII\b/i.test(kelasName)) return { roman: 'XII', number: '12' }
  if (/^XI\b/i.test(kelasName)) return { roman: 'XI', number: '11' }
  if (/^X\b/i.test(kelasName)) return { roman: 'X', number: '10' }
  return { roman: kelasName, number: kelasName }
}

function mapelMatchesKelas(mapel: MapelData, kelasName: string) {
  const level = kelasLevel(kelasName)
  const tokens = mapel.kelas.toLowerCase().split(/[,;/|]+/).map(item => item.trim()).filter(Boolean)
  if (tokens.length === 0) return true
  return tokens.some(token => {
    const normalized = token.replace(/^kelas\s+/i, '').trim()
    return normalized === level.roman.toLowerCase()
      || normalized === level.number
      || new RegExp(`\\b${level.roman.toLowerCase()}\\b`).test(normalized)
      || new RegExp(`\\b${level.number}\\b`).test(normalized)
  })
}

export default function AdminJadwal() {
  const [kelasOptions, setKelasOptions] = useState<string[]>(() => getKelasOptions())
  const [kelas, setKelas] = useState(() => getKelasOptions()[0] || '')
  const [mapelRows, setMapelRows] = useState<MapelData[]>(() => getMapelRows())
  const [tahunOptions, setTahunOptions] = useState<TahunData[]>(() => getTahunOptions())
  const activeTahun = getTahunOptions().find(item => item.status === 'Aktif') || getTahunOptions()[0]
  const [tahunAjaran, setTahunAjaran] = useState(activeTahun?.tahun || '2025/2026')
  const [semester, setSemester] = useState(activeTahun?.semester || 'Genap')
  const [jadwal, setJadwal] = useState<Record<string, JadwalData>>({})
  const [guruOptions, setGuruOptions] = useState<GuruData[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState<JadwalForm>({ hari: 'Senin', ke: 1, mapelKode: getMapelRows()[0]?.kode || '', guruNip: '', ruang: 'R-101' })
  const [error, setError] = useState('')

  const filteredMapel = mapelRows.filter(mapel => mapelMatchesKelas(mapel, kelas))
  const selectedMapel = filteredMapel.find(mapel => mapel.kode === form.mapelKode)

  const loadOptions = async () => {
    const [mapel, kelasItems, guru] = await Promise.all([fetchMapel(), getKelas(), getGuru()])
    const latestKelas = kelasItems.map(item => item.nama)
    setMapelRows(mapel)
    setKelasOptions(latestKelas)
    setGuruOptions(guru.filter(item => item.status !== 'Pensiun'))
    store('siakad_mapel', mapel)
    store('siakad_kelas', kelasItems)
    store('siakad_guru', guru)
    setKelas(current => latestKelas.includes(current) ? current : latestKelas[0] || '')
    setForm(current => ({
      ...current,
      mapelKode: mapel.some(item => item.kode === current.mapelKode) ? current.mapelKode : mapel[0]?.kode || '',
    }))
  }

  const loadJadwal = async (kelasAktif = kelas) => {
    const rows = await getJadwal({ kelas: kelasAktif, tahunAjaran, semester })
    const next = Object.fromEntries(rows.map(item => [`${item.kelas}-${item.hari}-${item.jamKe}`, item]))
    setJadwal(next)
    store('siakad_jadwal', Object.fromEntries(rows.map(item => [`${item.kelas}-${item.hari}-${item.jamKe}`, item.mapel])))
  }

  useEffect(() => {
    const refreshOptions = () => {
      setTahunOptions(getTahunOptions())
      loadOptions().catch(() => {
        const latestMapel = getMapelRows()
        const latestKelas = getKelasOptions()

        setMapelRows(latestMapel)
        setKelasOptions(latestKelas)
        setKelas(current => latestKelas.includes(current) ? current : latestKelas[0] || '')
      })
    }

    refreshOptions()
    window.addEventListener('focus', refreshOptions)

    return () => {
      window.removeEventListener('focus', refreshOptions)
    }
  }, [])

  useEffect(() => {
    getGuru().then(items => setGuruOptions(items.filter(item => item.status !== 'Pensiun'))).catch(() => setGuruOptions(readStored('siakad_guru', [])))
  }, [])

  useEffect(() => {
    if (!kelas) return
    void Promise.resolve().then(() => loadJadwal(kelas)).catch(() => {
      const local = readStored<Record<string, string>>('siakad_jadwal', defaultJadwal)
      setJadwal(Object.fromEntries(Object.entries(local).map(([key, mapel]) => {
        const [kelasKey, hariKey, keKey] = key.split('-')
        return [key, { kelas: kelasKey, hari: hariKey, jamKe: Number(keKey), jam: '', mapel, guruNip: '', guru: '-', ruang: '-', status: 'Mendatang' }]
      })))
    })
  }, [kelas, tahunAjaran, semester])

  const keyFor = (h: string, ke: number) => `${kelas}-${h}-${ke}`
  const getItem = (h: string, ke: number) => jadwal[keyFor(h, ke)]
  const getMapel = (h: string, ke: number) => getItem(h, ke)?.mapel || '-'
  const guruForMapel = (mapel?: MapelData) => {
    if (!mapel) return []
    const assigned = mapel.guruNip ? guruOptions.filter(guru => guru.nip === mapel.guruNip) : []
    const byName = guruOptions.filter(guru => guru.mapel === mapel.nama)
    return Array.from(new Map([...assigned, ...byName].map(guru => [guru.nip, guru])).values())
  }

  const openAdd = () => {
    const latestMapel = filteredMapel.length ? filteredMapel : getMapelRows().filter(mapel => mapelMatchesKelas(mapel, kelas))
    const latestKelas = kelasOptions.length ? kelasOptions : getKelasOptions()
    loadOptions().catch(() => undefined)
    setMapelRows(current => current.length ? current : latestMapel)
    setKelasOptions(latestKelas)
    if (latestKelas.length === 0) {
      alert('Belum ada kelas. Tambahkan kelas dulu di menu Kelola Kelas.')
      return
    }
    const mapel = latestMapel.find(item => item.nama === getMapel('Senin', 1)) || latestMapel[0]
    const guru = guruForMapel(mapel)[0]
    setForm({ hari: 'Senin', ke: 1, mapelKode: mapel?.kode || '', guruNip: guru?.nip || '', ruang: 'R-101' })
    setDrawerOpen(true)
  }

  const openCell = (h: string, ke: number) => {
    const latestMapel = filteredMapel.length ? filteredMapel : getMapelRows().filter(mapel => mapelMatchesKelas(mapel, kelas))
    loadOptions().catch(() => undefined)
    const item = getItem(h, ke)
    const mapel = latestMapel.find(row => row.kode === item?.mapelKode) || latestMapel.find(row => row.nama === item?.mapel) || latestMapel[0]
    const guru = item?.guruNip || guruForMapel(mapel)[0]?.nip || ''
    setForm({ hari: h, ke, mapelKode: mapel?.kode || '', guruNip: guru, ruang: item?.ruang || 'R-101' })
    setDrawerOpen(true)
  }

  const saveJadwal = async () => {
    if (!selectedMapel || !form.guruNip) {
      alert('Pilih mata pelajaran dan guru terlebih dahulu')
      return
    }

    try {
      setError('')
      const saved = await upsertJadwal({ hari: form.hari, jamKe: form.ke, kelas, tahunAjaran, semester, mapel: selectedMapel.nama, mapelKode: selectedMapel.kode, guruNip: form.guruNip, ruang: form.ruang })
      setJadwal(prev => ({ ...prev, [keyFor(form.hari, form.ke)]: saved }))
      addActivity('Jadwal diperbarui', `${kelas} - ${form.hari} jam ke-${form.ke}: ${selectedMapel.nama}`, 'bi-calendar-check')
      setDrawerOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal')
    }
  }

  const clearJadwal = async () => {
    await deleteJadwal({ hari: form.hari, jamKe: form.ke, kelas, tahunAjaran, semester })
    setJadwal(prev => {
      const next = { ...prev }
      delete next[keyFor(form.hari, form.ke)]
      return next
    })
    addActivity('Jadwal dikosongkan', `${kelas} - ${form.hari} jam ke-${form.ke}`, 'bi-calendar-x')
    setDrawerOpen(false)
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header">
        <h1>Kelola Jadwal</h1>
        <p className="text-muted">Pengaturan jadwal pelajaran</p>
      </div>

      {error && <div className="alert alert-danger"><i className="bi bi-exclamation-circle me-2"></i>{error}</div>}

      <div className="row g-3 mb-4 align-items-end">
        <div className="col-md-3">
          <label className="form-label">Tahun Ajaran</label>
          <select className="form-select" value={tahunAjaran} onChange={e => {
            const nextTahun = e.target.value
            setTahunAjaran(nextTahun)
            setSemester(tahunOptions.find(item => item.tahun === nextTahun)?.semester || 'Genap')
          }}>
            {Array.from(new Set(tahunOptions.map(item => item.tahun))).map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Semester</label>
          <select className="form-select" value={semester} onChange={e => setSemester(e.target.value)}>
            {Array.from(new Set(tahunOptions.filter(item => item.tahun === tahunAjaran).map(item => item.semester))).map(item => <option key={item} value={item}>{item}</option>)}
            {!tahunOptions.some(item => item.tahun === tahunAjaran && item.semester === semester) && <option>{semester}</option>}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Kelas</label>
          <select className="form-select" value={kelas} onChange={e => setKelas(e.target.value)} disabled={kelasOptions.length === 0}>
            {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          {kelasOptions.length === 0 && (
            <small className="text-danger">Belum ada kelas. Tambahkan kelas dulu di menu Kelola Kelas.</small>
          )}
        </div>
        <div className="col-md-3 text-end">
          <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Tambah Jadwal</button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered mb-0" style={{ fontSize: '0.8rem' }}>
              <thead className="table-dark">
                <tr>
                  <th style={{ width: 120 }}>Jam Ke</th>
                  {hari.map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {jamRows.map((row) => (
                  <tr key={row} style={row.startsWith('break') ? { background: '#f8f9fa' } : {}}>
                    <td className="fw-medium">
                      {row.startsWith('break') ? <span className="text-muted"><i className="bi bi-cup-hot me-1"></i>Istirahat</span> : <>Jam ke-{row}</>}
                    </td>
                    {hari.map(h => {
                      const slot = getJamSlot(h, row)
                      return (
                        <td key={h} className={!slot || slot.ke === 0 ? 'text-center text-muted' : 'text-center'}>
                          {!slot ? '-' : slot.ke === 0 ? (
                            <div><i className="bi bi-cup-hot me-1"></i>{slot.label}<div className="small">{slot.jam}</div></div>
                          ) : (
                            <button className="btn btn-sm btn-light border-0" onClick={() => openCell(h, slot.ke)} title="Edit jadwal">
                              <div className="small text-muted mb-1">{slot.jam}</div>
                              <span className="badge bg-primary bg-opacity-10 text-primary">{getMapel(h, slot.ke)}</span>
                              {getItem(h, slot.ke)?.guru && <div className="small text-muted mt-1">{getItem(h, slot.ke)?.guru}</div>}
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Atur Jadwal ${kelas}`}>
        <div className="mb-3"><label className="form-label">Hari</label><select className="form-select" value={form.hari} onChange={e => {
          const nextHari = e.target.value
          const available = getJamPelajaran(nextHari).filter(j => j.ke > 0)
          setForm({ ...form, hari: nextHari, ke: available.some(j => j.ke === form.ke) ? form.ke : available[0]?.ke || 1 })
        }}>{hari.map(h => <option key={h}>{h}</option>)}</select></div>
        <div className="mb-3"><label className="form-label">Jam Ke</label><select className="form-select" value={form.ke} onChange={e => setForm({ ...form, ke: Number(e.target.value) })}>{getJamPelajaran(form.hari).filter(j => j.ke > 0).map(j => <option key={j.ke} value={j.ke}>{j.ke}. {j.jam}</option>)}</select></div>
        <div className="mb-3">
          <label className="form-label">Mata Pelajaran</label>
          <select className="form-select" value={form.mapelKode} onChange={e => {
            const mapelKode = e.target.value
            const mapel = filteredMapel.find(item => item.kode === mapelKode)
            setForm({ ...form, mapelKode, guruNip: guruForMapel(mapel)[0]?.nip || '' })
          }} disabled={filteredMapel.length === 0}>
            <option value="">Pilih Mapel</option>
            {filteredMapel.map(m => <option key={m.kode} value={m.kode}>{m.kode} - {m.nama}</option>)}
          </select>
          {filteredMapel.length === 0 && (
            <small className="text-danger">Belum ada mapel untuk {kelas}. Atur kolom kelas mapel di menu Mata Pelajaran.</small>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Guru Pengajar</label>
          <select className="form-select" value={form.guruNip} onChange={e => setForm({ ...form, guruNip: e.target.value })}>
            <option value="">Pilih Guru</option>
            {guruForMapel(selectedMapel).map(guru => <option key={guru.nip} value={guru.nip}>{guru.nama}</option>)}
          </select>
          {guruForMapel(selectedMapel).length > 1 && <small className="text-muted">Pilih salah satu guru agar jadwal tidak bertabrakan.</small>}
        </div>
        <div className="mb-4"><label className="form-label">Ruang</label><input className="form-control" value={form.ruang} onChange={e => setForm({ ...form, ruang: e.target.value })} /></div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={saveJadwal}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-danger" onClick={clearJadwal}>Kosongkan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>
    </DashboardLayout>
  )
}
