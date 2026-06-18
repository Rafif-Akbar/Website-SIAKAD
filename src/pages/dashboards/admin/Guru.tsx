import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import { addActivity, exportCsv, readStored, store } from '../../../lib/frontendActions'
import { createGuru, getGuru, getMapel, getPasswordResetRequests, updateGuru, type PasswordResetRequest } from '../../../lib/api'
import { defaultGuru, defaultMapel, type MapelData } from '../../../lib/schoolData'

interface GuruData {
  nip: string
  nama: string
  mapel: string
  jk: string
  status: string
  password?: string
}

function getMapelOptions() {
  return Array.from(new Set(readStored<MapelData[]>('siakad_mapel', defaultMapel).map(mapel => mapel.nama))).sort((a, b) => a.localeCompare(b, 'id'))
}

const guruStatusOptions = ['Aktif', 'Cuti', 'Mutasi', 'Pensiun', 'Meninggal dunia', 'Nonaktif']

const navSections = [
  { items: [{ path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-grid' }] },
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

export default function AdminGuru() {
  const [data, setData] = useState<GuruData[]>(() => readStored('siakad_guru', defaultGuru))
  const [mapelOptions, setMapelOptions] = useState<string[]>(() => getMapelOptions())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<GuruData | null>(null)
  const [search, setSearch] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedNip, setSelectedNip] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState('Aktif')
  const [form, setForm] = useState<Partial<GuruData>>({ status: 'Aktif' })
  const [loading, setLoading] = useState(true)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([])

  useEffect(() => store('siakad_guru', data), [data])

  useEffect(() => {
    getGuru()
      .then(guru => setData(guru))
      .catch(() => setData(readStored('siakad_guru', defaultGuru)))
      .finally(() => setLoading(false))
    loadPasswordRequests()
  }, [])

  const loadPasswordRequests = async () => {
    try {
      const requests = await getPasswordResetRequests()
      setPasswordResetRequests(requests.filter(request => request.role === 'guru'))
    } catch {
      setPasswordResetRequests([])
    }
  }

  const loadMapelOptions = async () => {
    const mapel = await getMapel()
    store('siakad_mapel', mapel)
    setMapelOptions(Array.from(new Set(mapel.map(item => item.nama))).sort((a, b) => a.localeCompare(b, 'id')))
  }

  useEffect(() => {
    const refreshMapel = () => {
      loadMapelOptions().catch(() => setMapelOptions(getMapelOptions()))
    }

    refreshMapel()
    window.addEventListener('focus', refreshMapel)

    return () => {
      window.removeEventListener('focus', refreshMapel)
    }
  }, [])

  const filtered = data.filter(g => g.nama.toLowerCase().includes(search.toLowerCase()) || g.nip.includes(search))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const visibleNip = paginated.map(guru => guru.nip)
  const allVisibleSelected = visibleNip.length > 0 && visibleNip.every(nip => selectedNip.includes(nip))

  useEffect(() => {
    setCurrentPage(1)
    setSelectedNip([])
  }, [search, pageSize])

  const openAdd = () => {
    const latestMapel = mapelOptions.length ? mapelOptions : getMapelOptions()
    loadMapelOptions().catch(() => undefined)
    setEditing(null)
    setForm({ status: 'Aktif', jk: 'Laki-laki', mapel: latestMapel[0] || '' })
    setDrawerOpen(true)
  }

  const openEdit = (guru: GuruData) => {
    loadMapelOptions().catch(() => undefined)
    setEditing(guru)
    setForm({ ...guru, password: '' })
    setDrawerOpen(true)
  }

  const saveGuru = async () => {
    if (!form.nip || !form.nama || !form.mapel || !form.jk) {
      alert('NIP, nama, mapel, dan jenis kelamin wajib diisi')
      return
    }

    const passwordResetAllowed = editing
      ? passwordResetRequests.some(request => request.username === editing.nip)
      : true
    const nextPassword = form.password?.trim() || ''
    if (!editing && !nextPassword) {
      alert('Password awal wajib diisi untuk akun guru baru')
      return
    }

    const payload: GuruData = {
      nip: form.nip,
      nama: form.nama,
      mapel: form.mapel,
      jk: form.jk,
      status: form.status || 'Aktif',
      password: (!editing || passwordResetAllowed) && nextPassword ? nextPassword : undefined,
    }

    try {
      if (editing) {
        const updated = await updateGuru(editing.nip, payload)
        setData(prev => prev.map(g => g.nip === editing.nip ? updated : g))
        addActivity('Data guru diperbarui', `${payload.nama} - ${payload.mapel}`, 'bi-pencil-square')
        if (payload.password) await loadPasswordRequests()
      } else {
        if (data.some(g => g.nip === payload.nip)) {
          alert('NIP sudah digunakan')
          return
        }
        const created = await createGuru(payload)
        setData(prev => [...prev, created])
        addActivity('Data guru baru ditambahkan', `${payload.nama} - ${payload.mapel}`, 'bi-person-badge')
      }
      setDrawerOpen(false)
      loadMapelOptions().catch(() => undefined)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan data guru')
    }
  }

  const toggleSelectAll = () => {
    setSelectedNip(prev => allVisibleSelected
      ? prev.filter(nip => !visibleNip.includes(nip))
      : Array.from(new Set([...prev, ...visibleNip])))
  }

  const toggleSelected = (nip: string) => {
    setSelectedNip(prev => prev.includes(nip) ? prev.filter(item => item !== nip) : [...prev, nip])
  }

  const applyBulkStatus = async () => {
    if (selectedNip.length < 2) {
      alert('Pilih minimal 2 guru untuk mengubah status sekaligus.')
      return
    }

    try {
      const selectedRows = data.filter(guru => selectedNip.includes(guru.nip))
      const savedRows = await Promise.all(selectedRows.map(guru => updateGuru(guru.nip, { ...guru, status: bulkStatus })))
      setData(prev => {
        const savedByNip = new Map(savedRows.map(guru => [guru.nip, guru]))
        return prev.map(guru => savedByNip.get(guru.nip) || guru)
      })
      setSelectedNip([])
      addActivity('Status guru diperbarui massal', `${savedRows.length} guru menjadi ${bulkStatus}`, 'bi-check2-square')
      alert(`Status ${savedRows.length} guru berhasil diubah menjadi ${bulkStatus}.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status guru')
    }
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Data Guru</h1>
          <p className="text-muted mb-0">Manajemen data guru dan tenaga pendidik</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg me-2"></i>Tambah Data
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control" placeholder="Cari NIP atau nama..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="col-md-6 text-end">
          <div className="btn-group">
            <button
              className={`btn ${bulkMode ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => {
                setBulkMode(!bulkMode)
                setSelectedNip([])
              }}
            >
              <i className="bi bi-check2-square me-2"></i>Pilih Banyak
            </button>
            <button className="btn btn-outline-secondary" onClick={() => exportCsv('data-guru', filtered)}>
              <i className="bi bi-download me-2"></i>Ekspor
            </button>
          </div>
        </div>
      </div>

      {bulkMode && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body d-flex flex-wrap align-items-center gap-2">
            <span className="text-muted small">{selectedNip.length} guru dipilih</span>
            <select className="form-select" style={{ maxWidth: 240 }} value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
              {guruStatusOptions.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <button className="btn btn-primary" onClick={applyBulkStatus} disabled={selectedNip.length < 2}>
              <i className="bi bi-check-lg me-2"></i>Terapkan Status
            </button>
          </div>
        </div>
      )}

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                {bulkMode && <th style={{ width: 48 }}><input className="form-check-input" type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} /></th>}
                <th>No</th><th>NIP</th><th>Nama Lengkap</th><th>Mata Pelajaran</th><th>Jenis Kelamin</th><th>Status</th><th>Password</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={bulkMode ? 9 : 8} className="text-center py-4 text-muted">Memuat data...</td></tr>}
              {!loading && paginated.map((g, idx) => (
                <tr key={g.nip}>
                  {bulkMode && <td><input className="form-check-input" type="checkbox" checked={selectedNip.includes(g.nip)} onChange={() => toggleSelected(g.nip)} /></td>}
                  <td>{(safePage - 1) * pageSize + idx + 1}</td>
                  <td className="font-monospace small">{g.nip}</td>
                  <td className="fw-medium">{g.nama}</td>
                  <td>{g.mapel}</td>
                  <td>{g.jk}</td>
                  <td><span className={`badge-siakad ${g.status === 'Aktif' ? 'success' : 'warning'}`}>{g.status}</span></td>
                  <td className="small">
                    {passwordResetRequests.some(request => request.username === g.nip) ? (
                      <span className="badge bg-warning text-dark">Reset diminta</span>
                    ) : (
                      <span className="text-muted">Terkunci</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-link text-muted p-0 me-2" onClick={() => openEdit(g)}><i className="bi bi-pencil"></i></button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={bulkMode ? 9 : 8} className="text-center py-4 text-muted">Tidak ada data</td></tr>}
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

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Data Guru' : 'Tambah Data Guru'}>
        <div className="mb-3"><label className="form-label">NIP</label><input type="text" className="form-control" value={form.nip || ''} onChange={e => setForm({ ...form, nip: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Nama Lengkap</label><input type="text" className="form-control" value={form.nama || ''} onChange={e => setForm({ ...form, nama: e.target.value })} /></div>
        <div className="mb-3">
          <label className="form-label">Mata Pelajaran</label>
          <select className="form-select" value={form.mapel || ''} onChange={e => setForm({ ...form, mapel: e.target.value })} disabled={mapelOptions.length === 0}>
            <option value="">Pilih Mapel</option>
            {mapelOptions.map(mapel => <option key={mapel} value={mapel}>{mapel}</option>)}
          </select>
          {mapelOptions.length === 0 && (
            <small className="text-danger">Belum ada mapel. Tambahkan mata pelajaran dulu di menu Mata Pelajaran.</small>
          )}
        </div>
        <div className="mb-3"><label className="form-label">Jenis Kelamin</label><select className="form-select" value={form.jk || 'Laki-laki'} onChange={e => setForm({ ...form, jk: e.target.value })}><option>Laki-laki</option><option>Perempuan</option></select></div>
        <div className="mb-4"><label className="form-label">Status</label><select className="form-select" value={form.status || 'Aktif'} onChange={e => setForm({ ...form, status: e.target.value })}>{guruStatusOptions.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
        {!editing && (
          <div className="mb-4"><label className="form-label">Password Awal</label><input type="password" className="form-control" placeholder="Wajib diisi untuk akun baru" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
        )}
        {editing && passwordResetRequests.some(request => request.username === editing.nip) && (
          <div className="mb-4">
            <label className="form-label">Password Baru</label>
            <input type="password" className="form-control" placeholder="Masukan password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
        )}
        {editing && !passwordResetRequests.some(request => request.username === editing.nip) && (
          <div className="alert alert-light border mb-4">
            <i className="bi bi-lock me-2"></i>Password terkunci. Guru harus mengirim request pergantian password dari halaman login untuk membuka akses reset.
          </div>
        )}
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={saveGuru}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>
    </DashboardLayout>
  )
}
