import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import { getSettings, updateSettings } from '../../../lib/api'
import { addArchiveItem } from '../../../lib/archive'
import { addActivity } from '../../../lib/frontendActions'

interface EkskulData {
  id: string
  nama: string
  deskripsi: string
  kategori: string
  status: string
  gambar?: string
}

interface ImageEditState {
  src: string
  zoom: number
  offsetX: number
  offsetY: number
}

const defaultKategori = ['Akademik', 'Non Akademik', 'Olahraga', 'Seni', 'Keagamaan', 'Organisasi', 'Teknologi', 'Kewirausahaan', 'Sosial dan Lingkungan', 'Prestasi Khusus']
const defaultEkskul: EkskulData[] = []
const legacyDefaultIds = new Set(['basket', 'paduan-suara', 'karya-ilmiah'])

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

function getItems(value: unknown): EkskulData[] {
  if (!value || typeof value !== 'object' || !('items' in value)) return defaultEkskul
  const items = (value as { items?: unknown }).items
  return Array.isArray(items) ? (items as EkskulData[]).filter(item => !legacyDefaultIds.has(item.id)) : defaultEkskul
}

function cropEkskulImage({ src, zoom, offsetX, offsetY }: ImageEditState) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const width = 900
      const height = 520
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Browser tidak mendukung pemrosesan gambar'))
        return
      }

      const baseScale = Math.max(width / image.width, height / image.height)
      const scale = baseScale * zoom
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      const maxOffsetX = Math.max(0, (drawWidth - width) / 2)
      const maxOffsetY = Math.max(0, (drawHeight - height) / 2)
      const drawX = (width - drawWidth) / 2 + (offsetX / 100) * maxOffsetX
      const drawY = (height - drawHeight) / 2 + (offsetY / 100) * maxOffsetY

      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    image.onerror = () => reject(new Error('Gagal memproses gambar'))
    image.src = src
  })
}

export default function AdminEkstrakurikuler() {
  const [data, setData] = useState<EkskulData[]>(defaultEkskul)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<EkskulData | null>(null)
  const [form, setForm] = useState<Partial<EkskulData>>({ kategori: defaultKategori[0], status: 'Aktif' })
  const [imageEdit, setImageEdit] = useState<ImageEditState | null>(null)
  const [filter, setFilter] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    getSettings().then(response => {
      const items = getItems(response.settings.ekstrakurikuler)
      setData(items)
      updateSettings('ekstrakurikuler', { items }).catch(() => undefined)
    }).catch(() => undefined)
  }, [])

  const activeItems = useMemo(() => data.filter(item => item.status !== 'Arsip'), [data])
  const filtered = filter ? activeItems.filter(item => item.kategori === filter) : activeItems
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, pageSize])

  const persistItems = async (items: EkskulData[]) => {
    setData(items)
    await updateSettings('ekstrakurikuler', { items })
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ kategori: defaultKategori[0], status: 'Aktif' })
    setImageEdit(null)
    setDrawerOpen(true)
  }

  const openEdit = (item: EkskulData) => {
    setEditing(item)
    setForm(item)
    setImageEdit(null)
    setDrawerOpen(true)
  }

  const handleImage = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result || '')
      setForm(current => ({ ...current, gambar: src }))
      setImageEdit({ src, zoom: 1, offsetX: 0, offsetY: 0 })
    }
    reader.readAsDataURL(file)
  }

  const saveEkskul = async () => {
    if (!form.nama || !form.deskripsi || !form.kategori) {
      alert('Nama, deskripsi, dan kategori wajib diisi')
      return
    }

    const croppedImage = imageEdit ? await cropEkskulImage(imageEdit) : form.gambar
    const payload: EkskulData = {
      id: editing?.id || crypto.randomUUID(),
      nama: form.nama,
      deskripsi: form.deskripsi,
      kategori: form.kategori,
      status: 'Aktif',
      gambar: croppedImage,
    }

    const next = editing ? data.map(item => item.id === editing.id ? payload : item) : [payload, ...data]
    await persistItems(next)
    addActivity(editing ? 'Ekstrakurikuler diperbarui' : 'Ekstrakurikuler ditambahkan', payload.nama, 'bi-stars')
    setDrawerOpen(false)
    setImageEdit(null)
  }

  const archiveEkskul = async (item: EkskulData) => {
    if (!window.confirm(`Arsipkan ekstrakurikuler ${item.nama}?`)) return
    const archived = { ...item, status: 'Arsip' }
    await addArchiveItem({
      id: `ekstrakurikuler-${item.id}`,
      type: 'Ekstrakurikuler',
      label: item.nama,
      detail: item.kategori,
      data: archived,
    })
    await persistItems(data.map(row => row.id === item.id ? archived : row))
    addActivity('Ekstrakurikuler diarsipkan', item.nama, 'bi-archive')
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Ekstrakurikuler</h1>
          <p className="text-muted mb-0">Manajemen kegiatan ekstrakurikuler dan kategori</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Tambah Ekstrakurikuler</button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">Semua Kategori</option>
            {defaultKategori.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>No</th><th>Gambar</th><th>Nama</th><th>Kategori</th><th>Deskripsi</th><th>Aksi</th></tr></thead>
            <tbody>
              {paginated.map((item, idx) => (
                <tr key={item.id}>
                  <td>{(safePage - 1) * pageSize + idx + 1}</td>
                  <td>{item.gambar ? <img src={item.gambar} alt={item.nama} style={{ width: 72, height: 42, objectFit: 'cover', borderRadius: 6 }} /> : '-'}</td>
                  <td className="fw-medium">{item.nama}</td>
                  <td><span className="badge bg-info">{item.kategori}</span></td>
                  <td>{item.deskripsi}</td>
                  <td>
                    <button className="btn btn-link text-muted p-0 me-2" onClick={() => openEdit(item)} title="Edit"><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-link text-secondary p-0" onClick={() => archiveEkskul(item)} title="Arsipkan"><i className="bi bi-archive"></i></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">Belum ada ekstrakurikuler</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        <small className="text-muted">Menampilkan {paginated.length} dari {filtered.length} data terfilter, total {activeItems.length} data</small>
        <div className="d-flex align-items-center gap-2">
          <select className="form-select form-select-sm" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ width: 90 }}>
            {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={safePage === 1}>Prev</button>
          <span className="small text-muted">Halaman {safePage} / {totalPages}</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={safePage === totalPages}>Next</button>
        </div>
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Ekstrakurikuler' : 'Tambah Ekstrakurikuler'}>
        <div className="mb-3"><label className="form-label">Nama Ekstrakurikuler</label><input className="form-control" value={form.nama || ''} onChange={e => setForm({ ...form, nama: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Kategori</label><select className="form-select" value={form.kategori || defaultKategori[0]} onChange={e => setForm({ ...form, kategori: e.target.value })}>{defaultKategori.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
        <div className="mb-4"><label className="form-label">Deskripsi</label><textarea className="form-control" rows={4} value={form.deskripsi || ''} onChange={e => setForm({ ...form, deskripsi: e.target.value })} /></div>
        <div className="mb-4">
          <label className="form-label">Gambar Ekstrakurikuler</label>
          <input type="file" accept="image/*" className="form-control" onChange={e => handleImage(e.target.files?.[0])} />
          {imageEdit ? (
            <div className="mt-3">
              <div className="rounded overflow-hidden border bg-light" style={{ aspectRatio: '9 / 5.2', position: 'relative' }}>
                <img
                  src={imageEdit.src}
                  alt="Preview crop"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${imageEdit.zoom}) translate(${imageEdit.offsetX / 8}%, ${imageEdit.offsetY / 8}%)`,
                    transformOrigin: 'center',
                  }}
                />
              </div>
              <div className="mt-3">
                <label className="form-label small">Zoom</label>
                <input type="range" className="form-range" min="1" max="3" step="0.05" value={imageEdit.zoom} onChange={e => setImageEdit({ ...imageEdit, zoom: Number(e.target.value) })} />
                <label className="form-label small">Geser Horizontal</label>
                <input type="range" className="form-range" min="-100" max="100" value={imageEdit.offsetX} onChange={e => setImageEdit({ ...imageEdit, offsetX: Number(e.target.value) })} />
                <label className="form-label small">Geser Vertikal</label>
                <input type="range" className="form-range" min="-100" max="100" value={imageEdit.offsetY} onChange={e => setImageEdit({ ...imageEdit, offsetY: Number(e.target.value) })} />
              </div>
            </div>
          ) : (
            form.gambar && <img src={form.gambar} alt="Preview" className="img-fluid rounded mt-3" />
          )}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={saveEkskul}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>
    </DashboardLayout>
  )
}
