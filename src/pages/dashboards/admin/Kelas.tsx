import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import { archiveKelasWithSiswa, getGuru, getKelas, getSiswa, saveKelas, updateKelas, type GuruData, type KelasData, type SiswaData } from '../../../lib/api'
import { addActivity, readStored, store } from '../../../lib/frontendActions'

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

interface TahunData {
  id: string
  tahun: string
  semester: string
  status: string
  mulai: string
  selesai: string
}

const defaultTahunAjaran: TahunData[] = [
  { id: '1', tahun: '2025/2026', semester: 'Genap', status: 'Aktif', mulai: '2026-01-06', selesai: '2026-06-15' },
]

const initialData: KelasData[] = [
  { idKelas: '2025/2026', nama: 'X IPA 1', wali: 'Drs. Hadi Wijaya, M.Pd.', jmlSiswa: 32, kapasitas: 32, ruang: 'R-101' },
  { idKelas: '2025/2026', nama: 'X IPA 2', wali: 'Dra. Siti Aminah, M.Pd.', jmlSiswa: 30, kapasitas: 32, ruang: 'R-102' },
  { idKelas: '2025/2026', nama: 'X IPS 1', wali: 'Dra. Rina Marlina, M.Pd.', jmlSiswa: 31, kapasitas: 32, ruang: 'R-103' },
  { idKelas: '2025/2026', nama: 'X IPS 2', wali: 'Drs. Agus Pratama, M.Pd.', jmlSiswa: 28, kapasitas: 32, ruang: 'R-104' },
  { idKelas: '2025/2026', nama: 'XI IPA 1', wali: 'S.Pd. Budi Hartono', jmlSiswa: 32, kapasitas: 32, ruang: 'R-201' },
  { idKelas: '2025/2026', nama: 'XI IPA 2', wali: 'Dra. Maya Sari, M.Pd.', jmlSiswa: 29, kapasitas: 32, ruang: 'R-202' },
  { idKelas: '2025/2026', nama: 'XI IPS 1', wali: 'S.Pd. Andi Wijaya', jmlSiswa: 30, kapasitas: 32, ruang: 'R-203' },
  { idKelas: '2025/2026', nama: 'XI IPS 2', wali: 'Drs. Slamet Riyadi, M.Pd.', jmlSiswa: 31, kapasitas: 32, ruang: 'R-204' },
  { idKelas: '2025/2026', nama: 'XII IPA 1', wali: 'S.Pd. Dedi Kurniawan', jmlSiswa: 32, kapasitas: 32, ruang: 'R-301' },
  { idKelas: '2025/2026', nama: 'XII IPS 1', wali: 'S.Pd. Nurul Hidayah', jmlSiswa: 30, kapasitas: 32, ruang: 'R-302' },
]

const defaultGuru: GuruData[] = [
  { nip: '196805152000121002', nama: 'Drs. Hadi Wijaya, M.Pd.', mapel: 'Matematika', jk: 'Laki-laki', status: 'Aktif' },
  { nip: '197203201998032005', nama: 'Dra. Siti Aminah, M.Pd.', mapel: 'Bahasa Indonesia', jk: 'Perempuan', status: 'Aktif' },
  { nip: '198001102005012003', nama: 'Dra. Rina Marlina, M.Pd.', mapel: 'Biologi', jk: 'Perempuan', status: 'Aktif' },
  { nip: '197510052002121004', nama: 'Drs. Agus Pratama, M.Pd.', mapel: 'Fisika', jk: 'Laki-laki', status: 'Aktif' },
  { nip: '198506152010012006', nama: 'S.Pd. Budi Hartono', mapel: 'Kimia', jk: 'Laki-laki', status: 'Aktif' },
  { nip: '197811202003122007', nama: 'Dra. Maya Sari, M.Pd.', mapel: 'Bahasa Inggris', jk: 'Perempuan', status: 'Aktif' },
  { nip: '199003102015121008', nama: 'S.Pd. Andi Wijaya', mapel: 'Sejarah', jk: 'Laki-laki', status: 'Aktif' },
  { nip: '197412052001122009', nama: 'Drs. Slamet Riyadi, M.Pd.', mapel: 'Pendidikan Agama', jk: 'Laki-laki', status: 'Aktif' },
]

function getGuruOptions() {
  return readStored('siakad_guru', defaultGuru)
    .filter(guru => guru.status !== 'Pensiun')
    .map(guru => guru.nama)
}

function getActiveTahunOptions() {
  const rows = readStored<TahunData[]>('siakad_tahun_ajaran', defaultTahunAjaran)
  const active = rows.filter(item => item.status === 'Aktif').map(item => item.tahun)
  return Array.from(new Set(active.length ? active : [defaultTahunAjaran[0].tahun]))
}

export default function AdminKelas() {
  const [data, setData] = useState<KelasData[]>(() => readStored('siakad_kelas', initialData))
  const [siswaData, setSiswaData] = useState<SiswaData[]>([])
  const [guruOptions, setGuruOptions] = useState<string[]>(() => getGuruOptions())
  const [tahunOptions, setTahunOptions] = useState<string[]>(() => getActiveTahunOptions())
  const [tingkat, setTingkat] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<KelasData | null>(null)
  const [form, setForm] = useState<Partial<KelasData>>({ kapasitas: 32, jmlSiswa: 0 })

  const loadSiswa = async () => {
    try {
      setSiswaData(await getSiswa())
    } catch {
      setSiswaData([])
    }
  }

  const loadKelas = async () => {
    const items = await getKelas()
    setData(items)
    store('siakad_kelas', items)
  }

  const loadGuruOptions = async () => {
    const guru = await getGuru()
    store('siakad_guru', guru)
    setGuruOptions(guru.filter(item => item.status !== 'Pensiun').map(item => item.nama))
  }

  useEffect(() => {
    loadKelas().catch(() => setData(readStored('siakad_kelas', initialData)))
    loadSiswa()

    const refresh = () => {
      loadKelas().catch(() => undefined)
      loadSiswa()
    }
    window.addEventListener('focus', refresh)

    return () => window.removeEventListener('focus', refresh)
  }, [])

  useEffect(() => {
    const refreshGuru = () => {
      loadGuruOptions().catch(() => setGuruOptions(getGuruOptions()))
    }

    refreshGuru()
    window.addEventListener('focus', refreshGuru)

    return () => {
      window.removeEventListener('focus', refreshGuru)
    }
  }, [])

  const filtered = tingkat ? data.filter(k => k.nama.startsWith(tingkat)) : data
  const countSiswa = (namaKelas: string) => siswaData.filter(siswa => siswa.kelas === namaKelas).length

  const openAdd = () => {
    const latestGuru = guruOptions.length ? guruOptions : getGuruOptions()
    loadGuruOptions().catch(() => undefined)
    setGuruOptions(latestGuru)
    setEditing(null)
    const activeYears = getActiveTahunOptions()
    setTahunOptions(activeYears)
    setForm({ idKelas: activeYears[0], kapasitas: 32, jmlSiswa: 0, wali: latestGuru[0] || '' })
    setDrawerOpen(true)
  }

  const openEdit = (kelas: KelasData) => {
    loadGuruOptions().catch(() => undefined)
    setEditing(kelas)
    setForm({ ...kelas, jmlSiswa: countSiswa(kelas.nama) })
    setTahunOptions(getActiveTahunOptions())
    setDrawerOpen(true)
  }

  const saveKelasData = async () => {
    if (!form.nama || !form.wali || !form.ruang || form.kapasitas === undefined) {
      alert('Semua field kelas wajib diisi')
      return
    }

    const jumlahSiswaAktual = editing && editing.nama !== form.nama
      ? countSiswa(editing.nama)
      : countSiswa(form.nama)

    const payload: KelasData = {
      idKelas: form.idKelas || tahunOptions[0] || '',
      nama: form.nama,
      wali: form.wali,
      ruang: form.ruang,
      kapasitas: Number(form.kapasitas),
      jmlSiswa: jumlahSiswaAktual,
    }

    if (jumlahSiswaAktual > payload.kapasitas) {
      alert(`Kapasitas tidak boleh lebih kecil dari jumlah siswa saat ini (${jumlahSiswaAktual} siswa).`)
      return
    }

    try {
      if (!editing && data.some(k => k.nama === payload.nama)) {
        alert('Nama kelas sudah digunakan')
        return
      }
      const saved = editing ? await updateKelas(editing.nama, payload) : await saveKelas(payload)
      setData(prev => {
        const next = editing
          ? prev.map(k => k.nama === editing.nama ? saved : k).filter((k, index, rows) => rows.findIndex(item => item.nama === k.nama) === index)
          : prev.some(k => k.nama === saved.nama) ? prev.map(k => k.nama === saved.nama ? saved : k) : [...prev, saved]
        store('siakad_kelas', next)
        return next
      })
      addActivity(editing ? 'Data kelas diperbarui' : 'Kelas baru ditambahkan', `${payload.nama} - ${payload.ruang}`, editing ? 'bi-building' : 'bi-building-add')
      setDrawerOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan data kelas')
    }
  }

  const archiveKelas = async (kelas: KelasData) => {
    if (!window.confirm(`Arsipkan kelas ${kelas.nama}?`)) return
    if (siswaData.some(siswa => siswa.kelas === kelas.nama && siswa.status === 'Aktif')) {
      alert('Kelas tidak dapat diarsipkan karena masih terdapat siswa aktif.')
      return
    }

    try {
      await archiveKelasWithSiswa(kelas.nama)
      setData(prev => {
        const next = prev.filter(k => k.nama !== kelas.nama)
        store('siakad_kelas', next)
        return next
      })
      setSiswaData(prev => prev.filter(siswa => siswa.kelas !== kelas.nama))
      addActivity('Kelas diarsipkan', `${kelas.nama} - ${kelas.ruang}`, 'bi-archive')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengarsipkan data kelas')
    }
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Kelas</h1>
          <p className="text-muted mb-0">Pengaturan pembagian ruang kelas</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Tambah Kelas</button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <select className="form-select" value={tingkat} onChange={e => setTingkat(e.target.value)}>
            <option value="">Semua Tingkat</option>
            <option value="X ">Kelas X</option>
            <option value="XI ">Kelas XI</option>
            <option value="XII ">Kelas XII</option>
          </select>
        </div>
      </div>

      <div className="row g-3">
        {filtered.map((k) => (
          <div className="col-md-6 col-lg-4" key={k.nama}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, background: 'rgba(59,110,255,0.1)' }}>
                    <i className="bi bi-building text-primary fs-4"></i>
                  </div>
                  <span className="badge bg-primary bg-opacity-10 text-primary">{k.ruang}</span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h6 className="mb-0">{k.nama}</h6>
                  {k.idKelas && <span className="badge bg-light text-primary border">ID {k.idKelas}</span>}
                </div>
                <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>Wali Kelas: {k.wali}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-people text-muted"></i>
                  <span className="small">{countSiswa(k.nama)}/{k.kapasitas} siswa</span>
                  </div>
                  <div className="progress flex-grow-1 mx-2" style={{ height: 6 }}>
                    <div className={`progress-bar ${countSiswa(k.nama) >= k.kapasitas ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${Math.min((countSiswa(k.nama) / k.kapasitas) * 100, 100)}%` }}></div>
                  </div>
                </div>
                {countSiswa(k.nama) >= k.kapasitas && (
                  <div className="alert alert-danger py-2 px-3 mt-3 mb-0 small">Kelas penuh</div>
                )}
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => openEdit(k)}><i className="bi bi-pencil me-1"></i>Edit</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => archiveKelas(k)} title="Arsipkan"><i className="bi bi-archive"></i></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Kelas' : 'Tambah Kelas'}>
        <div className="mb-3">
          <label className="form-label">ID Kelas</label>
          <select className="form-select" value={form.idKelas || tahunOptions[0] || ''} onChange={e => setForm({ ...form, idKelas: e.target.value })}>
            {tahunOptions.map(tahun => <option key={tahun} value={tahun}>{tahun}</option>)}
          </select>
        </div>
        <div className="mb-3"><label className="form-label">Nama Kelas</label><input className="form-control" value={form.nama || ''} onChange={e => setForm({ ...form, nama: e.target.value })} /></div>
        <div className="mb-3">
          <label className="form-label">Wali Kelas</label>
          <select className="form-select" value={form.wali || ''} onChange={e => setForm({ ...form, wali: e.target.value })} disabled={guruOptions.length === 0}>
            <option value="">Pilih Guru</option>
            {guruOptions.map(guru => <option key={guru} value={guru}>{guru}</option>)}
          </select>
          {guruOptions.length === 0 && (
            <small className="text-danger">Belum ada guru. Tambahkan guru dulu di menu Kelola Guru.</small>
          )}
        </div>
        <div className="mb-3"><label className="form-label">Ruang</label><input className="form-control" value={form.ruang || ''} onChange={e => setForm({ ...form, ruang: e.target.value })} /></div>
        <div className="row g-3 mb-4">
          <div className="col-6"><label className="form-label">Jumlah Siswa</label><input type="number" className="form-control" value={editing ? countSiswa(editing.nama) : 0} readOnly /></div>
          <div className="col-6"><label className="form-label">Kapasitas</label><input type="number" className="form-control" value={form.kapasitas ?? 32} onChange={e => setForm({ ...form, kapasitas: Number(e.target.value) })} /></div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={saveKelasData}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>
    </DashboardLayout>
  )
}
