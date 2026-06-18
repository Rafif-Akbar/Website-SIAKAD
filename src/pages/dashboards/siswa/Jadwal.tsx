import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { readStored, store } from '../../../lib/frontendActions'
import { getGuru, getJadwal, getSiswa, type JadwalData, type SiswaData } from '../../../lib/api'
import { defaultGuru, defaultJadwal, defaultMapel, defaultSiswa } from '../../../lib/schoolData'

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

const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
const jamPelajaran = [
  { jam: '07:00 - 07:45', ke: 1 },
  { jam: '07:45 - 08:30', ke: 2 },
  { jam: '08:30 - 09:15', ke: 3 },
  { jam: '09:30 - 10:15', ke: 4 },
  { jam: '10:15 - 11:00', ke: 5 },
  { jam: '11:15 - 12:00', ke: 6 },
  { jam: '12:00 - 12:45', ke: 7 },
]

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('siakad_user') || '{}') as { username?: string; name?: string }
  } catch {
    return {}
  }
}

export default function SiswaJadwal() {
  const user = getCurrentUser()
  const fallbackSiswa = readStored('siakad_siswa', defaultSiswa).find(item => item.nisn === user.username) || defaultSiswa[0]
  const [siswa, setSiswa] = useState<SiswaData>(fallbackSiswa)
  const jadwal = readStored<Record<string, string>>('siakad_jadwal', defaultJadwal)
  const mapel = readStored('siakad_mapel', defaultMapel)
  const [guru, setGuru] = useState(() => readStored('siakad_guru', defaultGuru))
  const [jadwalDb, setJadwalDb] = useState<JadwalData[]>([])
  const now = new Date()
  const currentDay = now.toLocaleDateString('id-ID', { weekday: 'long' })
  const currentDate = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  const guruFor = (namaMapel: string) => {
    const fromMapel = mapel.find(item => item.nama === namaMapel)?.guru
    return fromMapel || guru.find(item => item.mapel === namaMapel)?.nama || '-'
  }

  useEffect(() => {
    getSiswa()
      .then(items => {
        store('siakad_siswa', items)
        setSiswa(items.find(item => item.nisn === user.username) || fallbackSiswa)
      })
      .catch(() => undefined)
    getGuru()
      .then(items => {
        store('siakad_guru', items)
        setGuru(items)
      })
      .catch(() => undefined)
  }, [user.username])

  useEffect(() => {
    getJadwal({ kelas: siswa.kelas })
      .then(setJadwalDb)
      .catch(() => undefined)
  }, [siswa.kelas])

  return (
    <DashboardLayout role="siswa" userName={siswa.nama} navSections={navSections}>
      <div className="page-header">
        <h1>Jadwal Pelajaran</h1>
        <p className="text-muted">Jadwal kelas {siswa.kelas} untuk {currentDay}, {currentDate}</p>
      </div>

      {[currentDay, ...hari.filter(h => h !== currentDay)].map(h => {
        const jadwalHari = jadwalDb.length > 0
          ? jadwalDb.filter(item => item.hari === h)
          : jamPelajaran
            .map(jp => ({ ...jp, jamKe: jp.ke, mapel: jadwal[`${siswa.kelas}-${h}-${jp.ke}`], guru: '', jam: jp.jam }))
            .filter(item => item.mapel)

        return (
          <div className="card border-0 shadow-sm mb-3" key={h}>
            <div className="card-header bg-white"><h6 className="mb-0">{h}{h === currentDay && <span className="badge bg-primary ms-2">Hari ini</span>}</h6></div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead><tr><th>Jam</th><th>Mata Pelajaran</th><th>Guru</th></tr></thead>
                  <tbody>
                    {jadwalHari.map((j, idx) => (
                      <tr key={`${h}-${idx}`}>
                        <td style={{ width: 130 }}>{j.jam}</td>
                        <td><span className="badge bg-primary bg-opacity-10 text-primary">{j.mapel}</span></td>
                        <td><i className="bi bi-person me-1 text-muted"></i>{j.guru ? j.guru : guruFor(j.mapel)}</td>
                      </tr>
                    ))}
                    {jadwalHari.length === 0 && <tr><td colSpan={3} className="text-muted py-3">Belum ada jadwal untuk hari ini.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })}
    </DashboardLayout>
  )
}
