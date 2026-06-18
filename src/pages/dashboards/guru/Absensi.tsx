import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { getAbsensiKelas, getJadwal, saveAbsensi, type AbsensiKelasData, type JadwalData } from '../../../lib/api'
import { getCurrentUser } from '../../../lib/schoolData'

const navSections = [
  { items: [
    { path: '/guru/dashboard', label: 'Dashboard', icon: 'bi-grid' },
    { path: '/guru/akun', label: 'Akun', icon: 'bi-person-gear' },
  ] },
  { title: 'Mengajar', items: [
    { path: '/guru/materi', label: 'Materi & Tugas', icon: 'bi-folder-plus' },
    { path: '/guru/jadwal', label: 'Jadwal Mengajar', icon: 'bi-calendar-week' },
    { path: '/guru/nilai', label: 'Input Nilai', icon: 'bi-file-earmark-text' },
    { path: '/guru/absensi', label: 'Input Absensi', icon: 'bi-clipboard-check' },
  ]},
]

type AbsensiStatus = 'H' | 'S' | 'I' | 'A'

interface SiswaAbsensi extends AbsensiKelasData {
  status: AbsensiStatus
}

const statusConfig: Record<AbsensiStatus, { label: string; color: string }> = {
  H: { label: 'Hadir', color: 'success' },
  S: { label: 'Sakit', color: 'warning' },
  I: { label: 'Izin', color: 'info' },
  A: { label: 'Alpa', color: 'danger' },
}

export default function GuruAbsensi() {
  const user = getCurrentUser()
  const [jadwal, setJadwal] = useState<JadwalData[]>([])
  const [selectedKelas, setSelectedKelas] = useState('')
  const [absensi, setAbsensi] = useState<SiswaAbsensi[]>([])
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [loadingAbsensi, setLoadingAbsensi] = useState(false)
  const [loadedKey, setLoadedKey] = useState('')
  const selectedDay = new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long' })
  const jadwalHariIni = jadwal.filter(item => item.hari === selectedDay)
  const kelasOptions = Array.from(new Set((jadwalHariIni.length ? jadwalHariIni : jadwal).map(item => item.kelas))).filter(Boolean)
  const activeKey = selectedKelas && tanggal ? `${selectedKelas}-${tanggal}` : ''

  useEffect(() => {
    if (!user.username) return
    getJadwal({ guruNip: user.username }).then(rows => {
      setJadwal(rows)
    }).catch(() => undefined)
  }, [user.username])

  useEffect(() => {
    if (kelasOptions.length === 0) {
      setSelectedKelas('')
      return
    }
    if (!kelasOptions.includes(selectedKelas)) {
      setSelectedKelas(kelasOptions[0])
    }
  }, [tanggal, jadwal])

  useEffect(() => {
    if (!selectedKelas) return
    const requestKey = `${selectedKelas}-${tanggal}`
    let cancelled = false
    setLoadingAbsensi(true)
    setLoadedKey('')
    setAbsensi([])
    getAbsensiKelas(selectedKelas, tanggal).then(rows => {
      if (cancelled) return
      setAbsensi(rows.map(row => ({
        ...row,
        status: row.alpa > 0 ? 'A' : row.izin > 0 ? 'I' : row.sakit > 0 ? 'S' : 'H',
      })))
      setLoadedKey(requestKey)
    }).catch(() => {
      if (cancelled) return
      setAbsensi([])
    }).finally(() => {
      if (cancelled) return
      setLoadingAbsensi(false)
    })

    return () => {
      cancelled = true
    }
  }, [selectedKelas, tanggal])

  const updateStatus = (idx: number, status: AbsensiStatus) => {
    const updated = [...absensi]
    updated[idx] = { ...updated[idx], status }
    setAbsensi(updated)
  }

  const saveData = async () => {
    if (loadingAbsensi || loadedKey !== activeKey) {
      alert('Tunggu sampai data absensi tanggal yang dipilih selesai dimuat.')
      return
    }

    try {
      setSaving(true)
      await saveAbsensi({
        tanggal,
        entries: absensi.map(item => ({
          ...item,
          hadir: item.status === 'H' ? 1 : 0,
          sakit: item.status === 'S' ? 1 : 0,
          izin: item.status === 'I' ? 1 : 0,
          alpa: item.status === 'A' ? 1 : 0,
        })),
      })
      alert('Absensi telah tersimpan')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan absensi')
    } finally {
      setSaving(false)
    }
  }

  const summary = {
    H: absensi.filter(s => s.status === 'H').length,
    S: absensi.filter(s => s.status === 'S').length,
    I: absensi.filter(s => s.status === 'I').length,
    A: absensi.filter(s => s.status === 'A').length,
  }

  return (
    <DashboardLayout role="guru" userName={user.name || 'Guru'} navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Input Absensi</h1>
          <p className="text-muted mb-0">Pencatatan kehadiran siswa per sesi</p>
        </div>
        <button className="btn btn-primary" onClick={saveData} disabled={saving || loadingAbsensi || loadedKey !== activeKey || absensi.length === 0}>
          <i className="bi bi-save me-2"></i>{saving ? 'Menyimpan...' : 'Simpan Absensi'}
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="form-label">Tanggal</label>
          <input type="date" className="form-control" value={tanggal} onChange={e => setTanggal(e.target.value)} />
          <small className="text-muted">Pilih tanggal lampau untuk memuat dan mengubah absensi yang sudah tersimpan.</small>
        </div>
        <div className="col-md-3">
          <label className="form-label">Kelas</label>
          <select className="form-select" value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)}>
            {kelasOptions.map(kelas => <option key={kelas} value={kelas}>{kelas}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Mata Pelajaran</label>
          <select className="form-select" value={(jadwalHariIni.length ? jadwalHariIni : jadwal).find(item => item.kelas === selectedKelas)?.mapel || ''} disabled>
            <option>{(jadwalHariIni.length ? jadwalHariIni : jadwal).find(item => item.kelas === selectedKelas)?.mapel || '-'}</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Jam Ke</label>
          <select className="form-select" value={(jadwalHariIni.length ? jadwalHariIni : jadwal).find(item => item.kelas === selectedKelas)?.jamKe || ''} disabled>
            <option>{(jadwalHariIni.length ? jadwalHariIni : jadwal).find(item => item.kelas === selectedKelas)?.jamKe || '-'}</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        {Object.entries(summary).map(([key, val]) => (
          <div className="col-md-3" key={key}>
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center gap-3 p-3">
                <div className={`d-flex align-items-center justify-content-center rounded-circle text-white`} style={{ width: 40, height: 40, background: `var(--bs-${statusConfig[key as AbsensiStatus].color})` }}>
                  <span className="fw-bold">{key}</span>
                </div>
                <div>
                  <div className="fw-bold">{val}</div>
                  <small className="text-muted">{statusConfig[key as AbsensiStatus].label}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr><th>No</th><th>Nama Siswa</th><th className="text-center">Hadir (H)</th><th className="text-center">Sakit (S)</th><th className="text-center">Izin (I)</th><th className="text-center">Alpa (A)</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loadingAbsensi && <tr><td colSpan={7} className="text-center py-4 text-muted">Memuat absensi tanggal {tanggal}...</td></tr>}
              {!loadingAbsensi && absensi.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-muted">Tidak ada data siswa untuk kelas dan tanggal ini.</td></tr>}
              {!loadingAbsensi && absensi.map((s, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td className="fw-medium">{s.nama}</td>
                  <td className="text-center">
                    <input type="radio" name={`absensi-${idx}`} checked={s.status === 'H'} onChange={() => updateStatus(idx, 'H')} />
                  </td>
                  <td className="text-center">
                    <input type="radio" name={`absensi-${idx}`} checked={s.status === 'S'} onChange={() => updateStatus(idx, 'S')} />
                  </td>
                  <td className="text-center">
                    <input type="radio" name={`absensi-${idx}`} checked={s.status === 'I'} onChange={() => updateStatus(idx, 'I')} />
                  </td>
                  <td className="text-center">
                    <input type="radio" name={`absensi-${idx}`} checked={s.status === 'A'} onChange={() => updateStatus(idx, 'A')} />
                  </td>
                  <td>
                    <span className={`badge bg-${statusConfig[s.status].color}`}>{statusConfig[s.status].label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
