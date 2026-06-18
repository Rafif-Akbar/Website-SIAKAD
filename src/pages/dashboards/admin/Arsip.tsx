import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { getArchiveItems, saveArchiveItems, type ArchiveItem } from '../../../lib/archive'
import { getSettings, restoreKelasWithSiswa, saveKelas, saveMapel, savePengumuman, savePrestasi, updateSettings } from '../../../lib/api'
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

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminArsip() {
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [type, setType] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getArchiveItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const types = Array.from(new Set(items.map(item => item.type)))
  const filtered = type ? items.filter(item => item.type === type) : items
  const itemKey = (item: ArchiveItem) => `${item.type}-${item.id}-${item.archivedAt}`
  const visibleKeys = filtered.map(itemKey)
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every(key => selected.includes(key))

  const toggleSelected = (key: string) => {
    setSelected(prev => prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key])
  }

  const toggleSelectAll = () => {
    setSelected(prev => allVisibleSelected
      ? prev.filter(key => !visibleKeys.includes(key))
      : Array.from(new Set([...prev, ...visibleKeys])))
  }

  const restoreItem = async (item: ArchiveItem) => {
    const data = item.data as Record<string, unknown>

    if (item.type === 'Kelas') {
      if ('kelas' in data && 'siswa' in data) {
        await restoreKelasWithSiswa(data)
      } else {
        await saveKelas(data as never)
      }
    } else if (item.type === 'Mata Pelajaran') {
      await saveMapel(data as never)
    } else if (item.type === 'Prestasi') {
      await savePrestasi(data as never)
    } else if (item.type === 'Pengumuman') {
      await savePengumuman({ ...data, status: 'Dipublikasikan' } as never)
    } else if (item.type === 'Tahun Ajaran') {
      const current = readStored<Record<string, unknown>[]>('siakad_tahun_ajaran', [])
      store('siakad_tahun_ajaran', [data, ...current.filter(row => row.id !== data.id)])
    } else if (item.type === 'Ekstrakurikuler') {
      const settings = await getSettings()
      const current = settings.settings.ekstrakurikuler?.items
      const rows = Array.isArray(current) ? current as Record<string, unknown>[] : []
      const restored = { ...data, status: 'Aktif' }
      await updateSettings('ekstrakurikuler', {
        items: [restored, ...rows.filter(row => row.id !== data.id)],
      })
    }
  }

  const restoreItems = async (targetItems: ArchiveItem[]) => {
    if (targetItems.length === 0) return
    if (!window.confirm(`Pulihkan ${targetItems.length} data dari arsip?`)) return

    try {
      for (const item of targetItems) {
        await restoreItem(item)
      }
      const restoredKeys = new Set(targetItems.map(itemKey))
      const next = items.filter(item => !restoredKeys.has(itemKey(item)))
      await saveArchiveItems(next)
      setItems(next)
      setSelected([])
      addActivity('Data arsip dipulihkan', `${targetItems.length} data dipulihkan`, 'bi-arrow-counterclockwise')
      alert(`${targetItems.length} data berhasil dipulihkan.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal memulihkan data arsip')
    }
  }

  const restoreSelected = () => {
    restoreItems(items.filter(item => selected.includes(itemKey(item))))
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header">
        <h1>Kelola Arsip</h1>
        <p className="text-muted mb-0">Data yang sudah diarsipkan</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="">Semua Arsip</option>
            {types.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="col-md-8 text-end">
          <button className="btn btn-primary" onClick={restoreSelected} disabled={selected.length === 0}>
            <i className="bi bi-arrow-counterclockwise me-2"></i>Pulihkan Terpilih
          </button>
        </div>
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 48 }}><input className="form-check-input" type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} /></th>
                <th>No</th><th>Jenis</th><th>Nama Data</th><th>Detail</th><th>Tanggal Arsip</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-4 text-muted">Memuat arsip...</td></tr>}
              {!loading && filtered.map((item, idx) => (
                <tr key={`${item.type}-${item.id}-${item.archivedAt}`}>
                  <td><input className="form-check-input" type="checkbox" checked={selected.includes(itemKey(item))} onChange={() => toggleSelected(itemKey(item))} /></td>
                  <td>{idx + 1}</td>
                  <td><span className="badge bg-secondary">{item.type}</span></td>
                  <td className="fw-medium">{item.label}</td>
                  <td>{item.detail || '-'}</td>
                  <td>{formatDate(item.archivedAt)}</td>
                  <td>
                    <button className="btn btn-link text-primary p-0" onClick={() => restoreItems([item])} title="Pulihkan"><i className="bi bi-arrow-counterclockwise"></i></button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-muted">Belum ada arsip</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
