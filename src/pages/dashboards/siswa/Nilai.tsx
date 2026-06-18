import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { readStored, store } from '../../../lib/frontendActions'
import { getKelas, getNilai, getSiswa, type SiswaData } from '../../../lib/api'
import { calculateNa, defaultKelas, defaultSiswa, getStoredNilai, gradeLabel } from '../../../lib/schoolData'
import { defaultSchoolProfile, loadSchoolProfile } from '../../../lib/schoolProfile'

const navSections = [
  { items: [
    { path: '/siswa/dashboard', label: 'Dashboard', icon: 'bi-grid' },
    { path: '/siswa/akun', label: 'Akun', icon: 'bi-person-gear' },
  ] },
  { title: 'Akademik', items: [
    { path: '/siswa/jadwal', label: 'Jadwal Pelajaran', icon: 'bi-calendar-week' },
    { path: '/siswa/nilai', label: 'Riwayat Nilai', icon: 'bi-file-earmark-text' },
    { path: '/siswa/absensi', label: 'Absensi', icon: 'bi-clipboard-check' },
    { path: '/siswa/materi', label: 'Materi & Tugas', icon: 'bi-folder' },
  ]},
  { title: 'Informasi', items: [
    { path: '/siswa/pengumuman', label: 'Pengumuman', icon: 'bi-megaphone' },
  ]},
]

export default function SiswaNilai() {
  const user = JSON.parse(localStorage.getItem('siakad_user') || '{}') as { username?: string }
  const fallbackSiswa = readStored('siakad_siswa', defaultSiswa).find(item => item.nisn === user.username) || defaultSiswa[0]
  const [siswa, setSiswa] = useState<SiswaData>(fallbackSiswa)
  const [wali, setWali] = useState(() => readStored('siakad_kelas', defaultKelas).find(kelas => kelas.nama === fallbackSiswa.kelas)?.wali || '-')
  const [nilaiSource, setNilaiSource] = useState(() => getStoredNilai())
  const [profile, setProfile] = useState(defaultSchoolProfile)

  useEffect(() => {
    loadSchoolProfile().then(setProfile).catch(() => undefined)
    getSiswa()
      .then(items => {
        const current = items.find(item => item.nisn === user.username) || fallbackSiswa
        setSiswa(current)
        store('siakad_siswa', items)
      })
      .catch(() => undefined)
  }, [user.username])

  useEffect(() => {
    getKelas()
      .then(items => {
        setWali(items.find(kelas => kelas.nama === siswa.kelas)?.wali || '-')
        store('siakad_kelas', items)
      })
      .catch(() => undefined)
    getNilai({ nisn: siswa.nisn })
      .then(items => {
        setNilaiSource(items.map(item => ({
          nisn: item.nisn,
          nama: item.nama || siswa.nama,
          kelas: item.kelas || siswa.kelas,
          mapel: item.mapel,
          jenis: 'Pengetahuan' as const,
          nh: item.nh,
          tugas: item.tugas || 0,
          pts: item.pts,
          pas: item.pas || item.na,
          dbNa: item.na,
        })))
      })
      .catch(() => undefined)
  }, [siswa.kelas, siswa.nama, siswa.nisn])

  const nilaiData = nilaiSource
    .filter(n => n.nisn === siswa.nisn && n.kelas === siswa.kelas)
    .map((n, idx) => ({ ...n, tugas: n.tugas || 0, no: idx + 1, na: 'dbNa' in n ? Number(n.dbNa) : calculateNa(n.nh, n.pts, n.pas, n.tugas) }))
  const rataRata = nilaiData.length ? Math.round(nilaiData.reduce((acc, n) => acc + n.na, 0) / nilaiData.length) : 0

  return (
    <DashboardLayout role="siswa" userName={siswa.nama} navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center no-print">
        <div>
          <h1>Riwayat Nilai</h1>
          <p className="text-muted mb-0">Kelas {siswa.kelas} - tersinkron dari input nilai guru</p>
        </div>
        <button className="btn btn-primary sticky-print-action" onClick={() => window.print()}><i className="bi bi-printer me-2"></i>Cetak Raport</button>
      </div>

      <div className="raport-container">
        <div className="raport-header">
          <img src={profile.logoUrl} alt="Logo" />
          <h4>PEMERINTAH PROVINSI JAWA TIMUR</h4>
          <h4>DINAS PENDIDIKAN</h4>
          <h5 className="fw-bold">{profile.namaSekolah.toUpperCase()}</h5>
          <p className="mb-0">{profile.alamat}</p>
        </div>

        <div className="row mb-4" style={{ fontSize: '0.9rem' }}>
          <div className="col-md-6">
            <table className="table table-borderless table-sm"><tbody>
              <tr><td style={{ width: 120 }}>Nama</td><td>: {siswa.nama}</td></tr>
              <tr><td>NISN</td><td>: {siswa.nisn}</td></tr>
              <tr><td>Kelas</td><td>: {siswa.kelas}</td></tr>
            </tbody></table>
          </div>
          <div className="col-md-6">
            <table className="table table-borderless table-sm"><tbody>
              <tr><td style={{ width: 120 }}>Semester</td><td>: Genap</td></tr>
              <tr><td>Tahun Ajaran</td><td>: 2025/2026</td></tr>
              <tr><td>Wali Kelas</td><td>: {wali}</td></tr>
            </tbody></table>
          </div>
        </div>

        <h6 className="mb-3">A. Nilai Pengetahuan dan Keterampilan</h6>
        <div className="table-responsive mb-4">
          <table className="table table-bordered" style={{ fontSize: '0.85rem' }}>
            <thead className="table-light"><tr><th>No</th><th>Mata Pelajaran</th><th>Jenis</th><th>Kelas</th><th className="text-center">NH</th><th className="text-center">Tugas</th><th className="text-center">PTS</th><th className="text-center">PAS</th><th className="text-center">NA</th><th className="text-center">KK</th></tr></thead>
            <tbody>
              {nilaiData.map(n => (
                <tr key={`${n.mapel}-${n.no}`}>
                  <td>{n.no}</td>
                  <td>{n.mapel}</td>
                  <td>{n.jenis}</td>
                  <td>{n.kelas}</td>
                  <td className="text-center">{n.nh || '-'}</td>
                  <td className="text-center">{n.tugas || '-'}</td>
                  <td className="text-center">{n.pts || '-'}</td>
                  <td className="text-center">{n.pas || '-'}</td>
                  <td className="text-center fw-bold">{n.na || '-'}</td>
                  <td className="text-center">{n.na ? gradeLabel(n.na) : '-'}</td>
                </tr>
              ))}
              {nilaiData.length === 0 && <tr><td colSpan={10} className="text-center text-muted py-4">Belum ada nilai yang diinput guru untuk siswa ini.</td></tr>}
              <tr className="table-primary fw-bold"><td colSpan={8} className="text-end">Rata-Rata</td><td className="text-center">{rataRata || '-'}</td><td></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
