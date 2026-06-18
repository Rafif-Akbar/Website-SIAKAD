import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
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

interface TahunData {
  id: string
  tahun: string
  semester: string
  status: string
  mulai: string
  selesai: string
}

const initialData: TahunData[] = [
  { id: '1', tahun: '2025/2026', semester: 'Genap', status: 'Aktif', mulai: '2026-01-06', selesai: '2026-06-15' },
  { id: '2', tahun: '2025/2026', semester: 'Ganjil', status: 'Selesai', mulai: '2025-07-14', selesai: '2025-12-20' },
  { id: '3', tahun: '2024/2025', semester: 'Genap', status: 'Selesai', mulai: '2025-01-06', selesai: '2025-06-14' },
  { id: '4', tahun: '2024/2025', semester: 'Ganjil', status: 'Selesai', mulai: '2024-07-15', selesai: '2024-12-21' },
]

export default function AdminTahunAjaran() {
  const [data, setData] = useState<TahunData[]>(() => readStored('siakad_tahun_ajaran', initialData))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<TahunData | null>(null)
  const [form, setForm] = useState<Partial<TahunData>>({ semester: 'Ganjil', status: 'Selesai' })

  useEffect(() => store('siakad_tahun_ajaran', data), [data])

  const openAdd = () => {
    setEditing(null)
    setForm({ semester: 'Ganjil', status: 'Selesai' })
    setDrawerOpen(true)
  }

  const openEdit = (item: TahunData) => {
    setEditing(item)
    setForm(item)
    setDrawerOpen(true)
  }

  const savePeriode = () => {
    if (!form.tahun || !form.semester || !form.mulai || !form.selesai) {
      alert('Tahun ajaran, semester, tanggal mulai, dan tanggal selesai wajib diisi')
      return
    }

    const payload: TahunData = {
      id: editing?.id || crypto.randomUUID(),
      tahun: form.tahun,
      semester: form.semester,
      mulai: form.mulai,
      selesai: form.selesai,
      status: form.status || 'Selesai',
    }

    if (payload.status === 'Aktif') {
      setData(prev => {
        const next = prev.map(t => ({ ...t, status: t.id === payload.id ? payload.status : 'Selesai' }))
        return editing ? next.map(t => t.id === editing.id ? payload : t) : [payload, ...next]
      })
    } else if (editing) {
      setData(prev => prev.map(t => t.id === editing.id ? payload : t))
    } else {
      setData(prev => [payload, ...prev])
    }

    addActivity(editing ? 'Periode akademik diperbarui' : 'Periode akademik ditambahkan', `${payload.tahun} - ${payload.semester}`, 'bi-calendar-event')
    setDrawerOpen(false)
  }

  const archivePeriode = async (id: string) => {
    const selected = data.find(t => t.id === id)
    if (!selected) return
    if (!confirm(`Arsipkan periode ${selected.tahun} - ${selected.semester}?`)) return
    await addArchiveItem({
      id: `tahun-ajaran-${selected.id}`,
      type: 'Tahun Ajaran',
      label: `${selected.tahun} - ${selected.semester}`,
      detail: `${selected.mulai} sampai ${selected.selesai}`,
      data: selected,
    })
    setData(prev => prev.filter(t => t.id !== id))
    addActivity('Periode akademik diarsipkan', `${selected.tahun} - ${selected.semester}`, 'bi-archive')
  }

  const activate = (id: string) => {
    const selected = data.find(t => t.id === id)
    setData(prev => prev.map(t => ({ ...t, status: t.id === id ? 'Aktif' : 'Selesai' })))
    if (selected) addActivity('Periode akademik diaktifkan', `${selected.tahun} - ${selected.semester}`, 'bi-check-circle')
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Tahun Ajaran</h1>
          <p className="text-muted mb-0">Pengaturan periode akademik sekolah</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Tambah Periode</button>
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr><th>No</th><th>Tahun Ajaran</th><th>Semester</th><th>Tanggal Mulai</th><th>Tanggal Selesai</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {data.map((t, idx) => (
                <tr key={t.id}>
                  <td>{idx + 1}</td>
                  <td className="fw-medium">{t.tahun}</td>
                  <td>{t.semester}</td>
                  <td>{t.mulai}</td>
                  <td>{t.selesai}</td>
                  <td><span className={`badge-siakad ${t.status === 'Aktif' ? 'success' : 'primary'}`}>{t.status}</span></td>
                  <td>
                    <button className="btn btn-link text-muted p-0 me-2" onClick={() => openEdit(t)} title="Edit"><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-link text-secondary p-0 me-2" onClick={() => archivePeriode(t.id)} title="Arsipkan"><i className="bi bi-archive"></i></button>
                    <button className="btn btn-link text-primary p-0" onClick={() => activate(t.id)} disabled={t.status === 'Aktif'} title="Selesai / jadikan aktif"><i className="bi bi-check-circle"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Periode' : 'Tambah Periode'}>
        <div className="mb-3"><label className="form-label">Tahun Ajaran</label><input className="form-control" placeholder="2026/2027" value={form.tahun || ''} onChange={e => setForm({ ...form, tahun: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Semester</label><select className="form-select" value={form.semester || 'Ganjil'} onChange={e => setForm({ ...form, semester: e.target.value })}><option>Ganjil</option><option>Genap</option></select></div>
        <div className="mb-3"><label className="form-label">Tanggal Mulai</label><input type="date" className="form-control" value={form.mulai || ''} onChange={e => setForm({ ...form, mulai: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Tanggal Selesai</label><input type="date" className="form-control" value={form.selesai || ''} onChange={e => setForm({ ...form, selesai: e.target.value })} /></div>
        <div className="mb-4"><label className="form-label">Status</label><select className="form-select" value={form.status || 'Selesai'} onChange={e => setForm({ ...form, status: e.target.value })}><option>Aktif</option><option>Selesai</option></select></div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={savePeriode}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>
    </DashboardLayout>
  )
}
