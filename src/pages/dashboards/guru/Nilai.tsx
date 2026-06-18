import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { readStored, store } from '../../../lib/frontendActions'
import { getGuru, getJadwal, getKelas, getNilai, getSiswa, saveNilaiBulk, type GuruData, type SiswaData } from '../../../lib/api'
import { calculateNa, defaultGuru, defaultKelas, defaultSiswa, getStoredNilai, type NilaiData } from '../../../lib/schoolData'

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

export default function GuruNilai() {
  const user = JSON.parse(localStorage.getItem('siakad_user') || '{}') as { username?: string; name?: string }
  const fallbackGuru = readStored('siakad_guru', defaultGuru).find(item => item.nip === user.username) || defaultGuru[0]
  const [guru, setGuru] = useState<GuruData>(fallbackGuru)
  const [kelasOptions, setKelasOptions] = useState<string[]>(() => readStored('siakad_kelas', defaultKelas).map(kelas => kelas.nama))
  const [mapelOptions, setMapelOptions] = useState<string[]>(() => fallbackGuru.mapel ? [fallbackGuru.mapel] : [])
  const [kelas, setKelas] = useState(kelasOptions[0] || 'X IPA 1')
  const [mapel, setMapel] = useState(mapelOptions[0] || fallbackGuru.mapel)
  const [jenis, setJenis] = useState<'Pengetahuan' | 'Keterampilan'>('Pengetahuan')
  const [nilai, setNilai] = useState<NilaiData[]>(() => getStoredNilai())
  const [siswaData, setSiswaData] = useState<SiswaData[]>(() => readStored('siakad_siswa', defaultSiswa))
  const [unsaved, setUnsaved] = useState<Set<string>>(new Set())

  const siswaKelas = useMemo(
    () => siswaData.filter(siswa => siswa.kelas === kelas && siswa.status === 'Aktif'),
    [kelas, siswaData],
  )

  useEffect(() => {
    const loadMaster = async () => {
      const [guruItems, jadwalItems, kelasItems] = await Promise.all([
        getGuru(),
        user.username ? getJadwal({ guruNip: user.username }) : Promise.resolve([]),
        getKelas(),
      ])
      const currentGuru = guruItems.find(item => item.nip === user.username) || fallbackGuru
      const nextKelas = Array.from(new Set(jadwalItems.map(item => item.kelas))).filter(Boolean)
      const nextMapel = Array.from(new Set(jadwalItems.map(item => item.mapel))).filter(Boolean)
      const kelasList = nextKelas.length ? nextKelas : kelasItems.map(item => item.nama)
      const mapelList = nextMapel.length ? nextMapel : [currentGuru.mapel].filter(Boolean)

      setGuru(currentGuru)
      setKelasOptions(kelasList)
      setMapelOptions(mapelList)
      setKelas(current => kelasList.includes(current) ? current : kelasList[0] || '')
      setMapel(current => mapelList.includes(current) ? current : mapelList[0] || '')
      store('siakad_guru', guruItems)
      store('siakad_kelas', kelasItems)
    }

    loadMaster().catch(() => undefined)

    getSiswa()
      .then(items => {
        setSiswaData(items)
        store('siakad_siswa', items)
      })
      .catch(() => undefined)
    getNilai()
      .then(items => {
        const mapped = items.map(item => ({
          nisn: item.nisn,
          nama: item.nama || '',
          kelas: item.kelas || '',
          mapel: item.mapel,
          jenis: 'Pengetahuan' as const,
          nh: item.nh,
          tugas: item.tugas || 0,
          pts: item.pts,
          pas: item.pas || item.na,
        }))
        setNilai(mapped)
        store('siakad_nilai', mapped)
      })
      .catch(() => undefined)
  }, [user.username])

  const nilaiFor = (nisn: string): NilaiData => nilai.find(n => n.nisn === nisn && n.kelas === kelas && n.mapel === mapel && n.jenis === jenis) || {
    nisn,
    nama: siswaKelas.find(s => s.nisn === nisn)?.nama || '',
    kelas,
    mapel,
    jenis,
    nh: 0,
    tugas: 0,
    pts: 0,
    pas: 0,
  }

  const updateNilai = (nisn: string, field: 'nh' | 'tugas' | 'pts' | 'pas', value: number) => {
    const siswa = siswaKelas.find(item => item.nisn === nisn)
    if (!siswa) return
    const current = nilaiFor(nisn)
    const updated = { ...current, nama: siswa.nama, kelas, mapel, jenis, [field]: value }
    setNilai(prev => {
      const exists = prev.some(n => n.nisn === nisn && n.kelas === kelas && n.mapel === mapel && n.jenis === jenis)
      return exists
        ? prev.map(n => n.nisn === nisn && n.kelas === kelas && n.mapel === mapel && n.jenis === jenis ? updated : n)
        : [...prev, updated]
    })
    setUnsaved(prev => new Set(prev).add(nisn))
  }

  const handleSave = async () => {
    const entries = siswaKelas.map(siswa => {
      const item = nilaiFor(siswa.nisn)
      const na = calculateNa(item.nh, item.pts, item.pas, item.tugas)
      return {
        nisn: siswa.nisn,
        nama: siswa.nama,
        kelas,
        mapel,
        nh: item.nh,
        tugas: item.tugas,
        pts: item.pts,
        pas: item.pas,
        na,
      }
    })

    try {
      await saveNilaiBulk(entries)
      store('siakad_nilai', nilai)
      setUnsaved(new Set())
      alert('Nilai berhasil disimpan')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan nilai ke database')
    }
  }

  return (
    <DashboardLayout role="guru" userName={guru.nama} navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Input Nilai Siswa</h1>
          <p className="text-muted mb-0">Nilai Pengetahuan dan Keterampilan tersimpan terpisah</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <i className="bi bi-save me-2"></i>Simpan Nilai
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4"><label className="form-label">Kelas</label><select className="form-select" value={kelas} onChange={e => setKelas(e.target.value)}>{kelasOptions.map(k => <option key={k}>{k}</option>)}</select></div>
        <div className="col-md-4"><label className="form-label">Mata Pelajaran</label><select className="form-select" value={mapel} onChange={e => setMapel(e.target.value)}>{mapelOptions.map(m => <option key={m}>{m}</option>)}</select></div>
        <div className="col-md-4"><label className="form-label">Jenis Nilai</label><select className="form-select" value={jenis} onChange={e => setJenis(e.target.value as 'Pengetahuan' | 'Keterampilan')}><option>Pengetahuan</option><option>Keterampilan</option></select></div>
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>No</th><th>NISN</th><th>Nama Siswa</th><th>Jenis</th><th className="text-center">NH</th><th className="text-center">Tugas</th><th className="text-center">PTS</th><th className="text-center">PAS</th><th className="text-center">NA</th><th>Status</th></tr></thead>
            <tbody>
              {siswaKelas.map((s, idx) => {
                const item = nilaiFor(s.nisn)
                const na = calculateNa(item.nh, item.pts, item.pas, item.tugas)
                const isUnsaved = unsaved.has(s.nisn)
                return (
                  <tr key={s.nisn} style={isUnsaved ? { borderLeft: '3px solid var(--inst-warning)' } : {}}>
                    <td>{idx + 1}</td>
                    <td className="font-monospace">{s.nisn}</td>
                    <td className="fw-medium">{s.nama}</td>
                    <td>{jenis}</td>
                    {(['nh', 'tugas', 'pts', 'pas'] as const).map(field => (
                      <td className="text-center" key={field}><input type="number" className={`grade-input ${isUnsaved ? 'unsaved' : ''}`} value={item[field] || ''} min={0} max={100} onChange={e => updateNilai(s.nisn, field, parseInt(e.target.value) || 0)} /></td>
                    ))}
                    <td className="text-center fw-bold">{na || '-'}</td>
                    <td>{isUnsaved ? <span className="badge-siakad warning">Belum disimpan</span> : <span className="badge-siakad success">Tersimpan</span>}</td>
                  </tr>
                )
              })}
              {siswaKelas.length === 0 && <tr><td colSpan={10} className="text-center py-4 text-muted">Belum ada siswa aktif di kelas ini.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
