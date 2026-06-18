import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import { addActivity, readStored, store } from '../../../lib/frontendActions'
import { deleteMapel, getGuru, getMapel, saveMapel, type GuruData, type MapelData } from '../../../lib/api'
import { addArchiveItem } from '../../../lib/archive'
import { defaultMapel } from '../../../lib/schoolData'

const tingkatOptions = ['X', 'XI', 'XII']

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

export default function AdminMapel() {
  const [data, setData] = useState<MapelData[]>(() => readStored('siakad_mapel', defaultMapel))
  const [guruOptions, setGuruOptions] = useState<GuruData[]>([])
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<MapelData | null>(null)
  const [form, setForm] = useState<Partial<MapelData>>({ kelompok: 'A', kelas: 'X, XI, XII', jpm: 2 })
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const loadMapel = async () => {
    const items = await getMapel()
    setData(items)
    store('siakad_mapel', items)
  }

  const loadGuru = async () => {
    const items = await getGuru()
    setGuruOptions(items.filter(guru => guru.status !== 'Pensiun'))
    store('siakad_guru', items)
  }

  useEffect(() => {
    loadMapel().catch(() => setData(readStored('siakad_mapel', defaultMapel)))
    loadGuru().catch(() => undefined)

    const refresh = () => {
      loadMapel().catch(() => undefined)
      loadGuru().catch(() => undefined)
    }
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const filtered = data.filter(m => `${m.kode} ${m.nama}`.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  const openAdd = () => {
    setEditing(null)
    loadGuru().catch(() => undefined)
    setForm({ kelompok: 'A', kelas: 'X, XI, XII', jpm: 2, guruNip: '' })
    setDrawerOpen(true)
  }

  const openEdit = (mapel: MapelData) => {
    setEditing(mapel)
    loadGuru().catch(() => undefined)
    setForm(mapel)
    setDrawerOpen(true)
  }

  const toggleTingkat = (tingkat: string) => {
    const selected = (form.kelas || '').split(',').map(item => item.trim()).filter(Boolean)
    const next = selected.includes(tingkat)
      ? selected.filter(item => item !== tingkat)
      : [...selected, tingkat]
    setForm({ ...form, kelas: next.join(', ') })
  }

  const saveMapelData = async () => {
    if (!form.kode || !form.nama || !form.kelompok || !form.kelas || !form.jpm) {
      alert('Semua field mapel wajib diisi')
      return
    }

    const payload: MapelData = {
      kode: form.kode,
      nama: form.nama,
      kelompok: form.kelompok,
      kelas: form.kelas,
      jpm: Number(form.jpm),
      guruNip: form.guruNip || '',
    }

    try {
      if (!editing && data.some(m => m.kode === payload.kode)) {
        const existing = data.find(m => m.kode === payload.kode)
        if (existing?.nama !== payload.nama) {
          alert('Kode mapel sudah digunakan')
          return
        }
      }
      const saved = await saveMapel(payload)
      setData(prev => prev.some(m => m.kode === saved.kode) ? prev.map(m => m.kode === saved.kode ? saved : m) : [...prev, saved])
      await loadMapel().catch(() => undefined)
      addActivity(editing ? 'Mata pelajaran diperbarui' : 'Mata pelajaran baru ditambahkan', `${payload.kode} - ${payload.nama}`, 'bi-book')
      setDrawerOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan mata pelajaran')
    }
  }

  const archiveMapel = async (mapel: MapelData) => {
    if (!window.confirm(`Arsipkan mata pelajaran ${mapel.nama}?`)) return

    try {
      await addArchiveItem({
        id: `mapel-${mapel.kode}`,
        type: 'Mata Pelajaran',
        label: `${mapel.kode} - ${mapel.nama}`,
        detail: `Kelompok ${mapel.kelompok}, kelas ${mapel.kelas}`,
        data: mapel,
      })
      await deleteMapel(mapel.kode)
      setData(prev => {
        const next = prev.filter(m => m.kode !== mapel.kode)
        store('siakad_mapel', next)
        return next
      })
      addActivity('Mata pelajaran diarsipkan', `${mapel.kode} - ${mapel.nama}`, 'bi-archive')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengarsipkan mata pelajaran')
    }
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Mata Pelajaran</h1>
          <p className="text-muted mb-0">Daftar mata pelajaran berdasarkan kurikulum</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Tambah Mapel</button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control" placeholder="Cari mata pelajaran..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr><th>No</th><th>Kode</th><th>Nama Mata Pelajaran</th><th>Guru</th><th>Kelompok</th><th>Kelas</th><th>JPM</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {paginated.map((m, idx) => (
                <tr key={m.kode}>
                  <td>{(safePage - 1) * pageSize + idx + 1}</td>
                  <td className="font-monospace fw-medium">{m.kode}</td>
                  <td>{m.nama}</td>
                  <td>{m.guru || '-'}</td>
                  <td><span className="badge bg-info">{m.kelompok}</span></td>
                  <td>{m.kelas}</td>
                  <td>{m.jpm} x</td>
                  <td>
                    <button className="btn btn-link text-muted p-0 me-2" onClick={() => openEdit(m)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-link text-secondary p-0" onClick={() => archiveMapel(m)} title="Arsipkan"><i className="bi bi-archive"></i></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-4 text-muted">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        <small className="text-muted">Menampilkan {paginated.length} dari {filtered.length} data terfilter, total {data.length} data</small>
        <div className="d-flex align-items-center gap-2">
          <select className="form-select form-select-sm" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ width: 90 }}>
            {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={safePage === 1}>Prev</button>
          <span className="small text-muted">Halaman {safePage} / {totalPages}</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={safePage === totalPages}>Next</button>
        </div>
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}>
        <div className="mb-3"><label className="form-label">Kode</label><input className="form-control" value={form.kode || ''} onChange={e => setForm({ ...form, kode: e.target.value.toUpperCase() })} /></div>
        <div className="mb-3"><label className="form-label">Nama Mata Pelajaran</label><input className="form-control" value={form.nama || ''} onChange={e => setForm({ ...form, nama: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Guru Pengajar</label><select className="form-select" value={form.guruNip || ''} onChange={e => setForm({ ...form, guruNip: e.target.value })}><option value="">Ikuti data Kelola Guru</option>{guruOptions.map(g => <option key={g.nip} value={g.nip}>{g.nama} - {g.mapel}</option>)}</select></div>
        <div className="mb-3"><label className="form-label">Kelompok</label><select className="form-select" value={form.kelompok || 'A'} onChange={e => setForm({ ...form, kelompok: e.target.value })}><option>A</option><option>B</option><option>Peminatan</option></select></div>
        <div className="mb-3">
          <label className="form-label">Kelas</label>
          <div className="d-flex flex-wrap gap-3">
            {tingkatOptions.map(tingkat => (
              <div className="form-check" key={tingkat}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`mapel-${tingkat}`}
                  checked={(form.kelas || '').split(',').map(item => item.trim()).includes(tingkat)}
                  onChange={() => toggleTingkat(tingkat)}
                />
                <label className="form-check-label" htmlFor={`mapel-${tingkat}`}>Kelas {tingkat}</label>
              </div>
            ))}
          </div>
          <small className="text-muted">Pilihan ini menjadi filter mata pelajaran saat mengatur jadwal kelas.</small>
        </div>
        <div className="mb-4"><label className="form-label">JPM</label><input type="number" min={1} className="form-control" value={form.jpm || 1} onChange={e => setForm({ ...form, jpm: Number(e.target.value) })} /></div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={saveMapelData}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>
    </DashboardLayout>
  )
}
