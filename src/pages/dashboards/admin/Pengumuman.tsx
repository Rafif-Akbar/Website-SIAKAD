import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import { getPengumuman, savePengumuman as savePengumumanApi } from '../../../lib/api'
import { addArchiveItem } from '../../../lib/archive'
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

interface PengumumanData {
  id: string
  judul: string
  kategori: string
  target: string
  tanggal: string
  status: string
  isi: string
  penting?: boolean
}

const initialData: PengumumanData[] = [
  { id: '1', judul: 'Pengumuman Awal Semester Genap 2025/2026', kategori: 'Akademik', target: 'Semua', tanggal: '15 Jan 2026', status: 'Dipublikasikan', isi: 'Kegiatan belajar mengajar semester genap dimulai sesuai kalender akademik.' },
  { id: '2', judul: 'Jadwal Ujian Tengah Semester (PTS)', kategori: 'Akademik', target: 'Siswa', tanggal: '12 Jan 2026', status: 'Dipublikasikan', isi: 'Jadwal PTS dapat dilihat melalui wali kelas masing-masing.' },
  { id: '3', judul: 'Pendaftaran Ekstrakurikuler Semester Genap', kategori: 'Kegiatan', target: 'Siswa', tanggal: '08 Jan 2026', status: 'Dipublikasikan', isi: 'Pendaftaran ekstrakurikuler dibuka sampai akhir Januari.' },
  { id: '4', judul: 'Workshop Literasi Digital untuk Guru', kategori: 'Kegiatan', target: 'Guru', tanggal: '28 Des 2025', status: 'Dipublikasikan', isi: 'Workshop dilaksanakan di ruang multimedia.' },
  { id: '5', judul: 'Pengumuman Kelulusan Kelas XII 2025', kategori: 'Akademik', target: 'Siswa', tanggal: '05 Jan 2026', status: 'Arsip', isi: 'Dokumen pengumuman kelulusan tersimpan di arsip sekolah.' },
]

export default function AdminPengumuman() {
  const [data, setData] = useState<PengumumanData[]>(() => readStored('siakad_pengumuman', initialData))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<PengumumanData | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Partial<PengumumanData>>({ kategori: 'Akademik', target: 'Semua', status: 'Dipublikasikan' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => store('siakad_pengumuman', data), [data])

  useEffect(() => {
    getPengumuman()
      .then(items => {
        setData(items)
        store('siakad_pengumuman', items)
        setError('')
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Gagal memuat pengumuman dari database')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = data.filter(p => p.status !== 'Arsip' && p.judul.toLowerCase().includes(search.toLowerCase()))

  const openAdd = () => {
    setEditing(null)
    setForm({ kategori: 'Akademik', target: 'Semua', status: 'Dipublikasikan' })
    setDrawerOpen(true)
  }

  const openEdit = (item: PengumumanData) => {
    setEditing(item)
    setForm(item)
    setDrawerOpen(true)
  }

  const savePengumuman = async () => {
    if (!form.judul || !form.kategori || !form.target || !form.isi) {
      alert('Judul, kategori, target, dan isi pengumuman wajib diisi')
      return
    }

    const payload: PengumumanData = {
      id: editing?.id || crypto.randomUUID(),
      judul: form.judul,
      kategori: form.kategori,
      target: form.target,
      tanggal: editing?.tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: form.status || 'Dipublikasikan',
      isi: form.isi,
      penting: Boolean(form.penting),
    }

    try {
      const saved = await savePengumumanApi(payload)
      if (editing) {
        setData(prev => prev.map(p => p.id === editing.id ? saved : p))
        addActivity('Pengumuman diperbarui', `${saved.judul} untuk ${saved.target}`, 'bi-megaphone')
      } else {
        setData(prev => [saved, ...prev])
        addActivity('Pengumuman dipublikasikan', `${saved.judul} untuk ${saved.target}`, 'bi-megaphone')
      }
      setError('')
      setDrawerOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan pengumuman ke database'
      setError(message)
      alert(message)
    }
  }

  const archivePengumuman = async (item: PengumumanData) => {
    if (!window.confirm(`Arsipkan pengumuman ${item.judul}?`)) return

    try {
      const archived = { ...item, status: 'Arsip' }
      const saved = await savePengumumanApi(archived)
      await addArchiveItem({
        id: `pengumuman-${item.id}`,
        type: 'Pengumuman',
        label: item.judul,
        detail: `${item.kategori} - ${item.target}`,
        data: saved,
      })
      setData(prev => prev.map(p => p.id === item.id ? saved : p))
      addActivity('Pengumuman diarsipkan', item.judul, 'bi-archive')
      setError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengarsipkan pengumuman'
      setError(message)
      alert(message)
    }
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Pengumuman</h1>
          <p className="text-muted mb-0">Manajemen informasi sekolah</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg me-2"></i>Buat Pengumuman
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control" placeholder="Cari pengumuman..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr><th>No</th><th>Judul</th><th>Kategori</th><th>Target</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-4 text-muted">Memuat pengumuman...</td></tr>}
              {!loading && filtered.map((p, idx) => (
                <tr key={p.id}>
                  <td>{idx + 1}</td>
                  <td className="fw-medium">{p.judul}</td>
                  <td><span className="badge bg-info">{p.kategori}</span></td>
                  <td>{p.target}</td>
                  <td>{p.tanggal}</td>
                  <td><span className={`badge-siakad ${p.status === 'Dipublikasikan' ? 'success' : 'primary'}`}>{p.status}</span></td>
                  <td>
                    <button className="btn btn-link text-muted p-0 me-2" onClick={() => openEdit(p)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-link text-secondary p-0" onClick={() => archivePengumuman(p)} title="Arsipkan"><i className="bi bi-archive"></i></button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-muted">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}>
        <div className="mb-3"><label className="form-label">Judul Pengumuman</label><input type="text" className="form-control" placeholder="Masukkan judul" value={form.judul || ''} onChange={e => setForm({ ...form, judul: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Kategori</label><select className="form-select" value={form.kategori || 'Akademik'} onChange={e => setForm({ ...form, kategori: e.target.value })}><option>Akademik</option><option>Kegiatan</option><option>Prestasi</option><option>Umum</option></select></div>
        <div className="mb-3"><label className="form-label">Target</label><select className="form-select" value={form.target || 'Semua'} onChange={e => setForm({ ...form, target: e.target.value })}><option>Semua</option><option>Siswa</option><option>Guru</option></select></div>
        <div className="mb-3"><label className="form-label">Isi Pengumuman</label><textarea className="form-control" rows={5} placeholder="Tulis isi pengumuman..." value={form.isi || ''} onChange={e => setForm({ ...form, isi: e.target.value })}></textarea></div>
        <div className="mb-4">
          <div className="form-check mb-2">
            <input className="form-check-input" type="checkbox" id="important" checked={Boolean(form.penting)} onChange={e => setForm({ ...form, penting: e.target.checked })} />
            <label className="form-check-label" htmlFor="important">Tandai sebagai penting</label>
          </div>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="publish" checked={(form.status || 'Dipublikasikan') === 'Dipublikasikan'} onChange={e => setForm({ ...form, status: e.target.checked ? 'Dipublikasikan' : 'Arsip' })} />
            <label className="form-check-label" htmlFor="publish">Publikasikan segera</label>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={savePengumuman}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>
    </DashboardLayout>
  )
}
