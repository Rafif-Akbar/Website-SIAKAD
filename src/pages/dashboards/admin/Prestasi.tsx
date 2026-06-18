import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import { deletePrestasi, getPrestasi, savePrestasi, type PrestasiApiData } from '../../../lib/api'
import { addArchiveItem } from '../../../lib/archive'
import { addActivity } from '../../../lib/frontendActions'

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

interface ImageEditState {
  src: string
  zoom: number
  offsetX: number
  offsetY: number
}

function cropPrestasiImage({ src, zoom, offsetX, offsetY }: ImageEditState) {
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

export default function AdminPrestasi() {
  const [data, setData] = useState<PrestasiApiData[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<PrestasiApiData | null>(null)
  const [form, setForm] = useState<Partial<PrestasiApiData>>({ kategori: 'akademik' })
  const [imageEdit, setImageEdit] = useState<ImageEditState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = () => {
    setLoading(true)
    getPrestasi()
      .then(items => {
        setData(items)
        setError('')
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Gagal memuat prestasi'))
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ kategori: 'akademik' })
    setImageEdit(null)
    setDrawerOpen(true)
  }

  const openEdit = (item: PrestasiApiData) => {
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

  const saveData = async () => {
    if (!form.judul || !form.kategori || !form.deskripsi) {
      alert('Judul prestasi, kategori, dan deskripsi wajib diisi')
      return
    }

    try {
      const croppedImage = imageEdit ? await cropPrestasiImage(imageEdit) : form.gambar
      const payload: PrestasiApiData = {
        id: editing?.id || crypto.randomUUID(),
        judul: form.judul,
        kategori: form.kategori,
        deskripsi: form.deskripsi,
        gambar: croppedImage,
        tanggal: editing?.tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      } as PrestasiApiData
      const saved = await savePrestasi(payload)
      setData(prev => editing ? prev.map(item => item.id === editing.id ? saved : item) : [saved, ...prev])
      addActivity(editing ? 'Prestasi diperbarui' : 'Prestasi ditambahkan', saved.judul, 'bi-trophy')
      setDrawerOpen(false)
      setImageEdit(null)
      setError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan prestasi'
      setError(message)
      alert(message)
    }
  }

  const archivePrestasi = async (item: PrestasiApiData) => {
    if (!window.confirm(`Arsipkan prestasi ${item.judul}?`)) return

    try {
      await addArchiveItem({
        id: `prestasi-${item.id}`,
        type: 'Prestasi',
        label: item.judul,
        detail: `${item.kategori} - ${item.tanggal}`,
        data: item,
      })
      await deletePrestasi(item.id)
      setData(prev => prev.filter(row => row.id !== item.id))
      addActivity('Prestasi diarsipkan', item.judul, 'bi-archive')
      setError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengarsipkan prestasi'
      setError(message)
      alert(message)
    }
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Prestasi</h1>
          <p className="text-muted mb-0">Manajemen prestasi</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Tambah Prestasi</button>
      </div>

      {error && <div className="alert alert-warning"><i className="bi bi-exclamation-triangle me-2"></i>{error}</div>}

      <div className="row g-4">
        {loading && <div className="col-12 text-muted">Memuat prestasi...</div>}
        {!loading && data.map(item => (
          <div className="col-md-6 col-xl-4" key={item.id}>
            <div className="prestasi-card h-100">
              <div className="prestasi-img">
                {item.gambar ? <img src={item.gambar} alt={item.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="bi bi-trophy"></i>}
              </div>
              <div className="prestasi-body">
                <div className="category">{item.kategori.toUpperCase()}</div>
                <h6>{item.judul}</h6>
                <p>{item.deskripsi}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(item)}><i className="bi bi-pencil me-1"></i>Edit</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => archivePrestasi(item)}><i className="bi bi-archive me-1"></i>Arsipkan</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading && data.length === 0 && <div className="col-12"><div className="card border-0 shadow-sm"><div className="card-body text-center py-5 text-muted">Belum ada prestasi.</div></div></div>}
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Prestasi' : 'Tambah Prestasi'}>
        <div className="mb-3"><label className="form-label">Judul Prestasi</label><input className="form-control" value={form.judul || ''} onChange={e => setForm({ ...form, judul: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Kategori</label><select className="form-select" value={form.kategori || 'akademik'} onChange={e => setForm({ ...form, kategori: e.target.value as PrestasiApiData['kategori'] })}><option value="akademik">Akademik</option><option value="non-akademik">Non-Akademik</option></select></div>
        <div className="mb-3"><label className="form-label">Deskripsi Prestasi</label><textarea className="form-control" rows={4} value={form.deskripsi || ''} onChange={e => setForm({ ...form, deskripsi: e.target.value })} /></div>
        <div className="mb-4">
          <label className="form-label">Unggah Gambar</label>
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
          <button className="btn btn-primary flex-fill" onClick={saveData}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>
    </DashboardLayout>
  )
}
