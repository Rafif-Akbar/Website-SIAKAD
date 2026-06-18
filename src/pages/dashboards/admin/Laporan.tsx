import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import DashboardLayout from '../../../components/DashboardLayout'
import { getSettings } from '../../../lib/api'
import { readStored } from '../../../lib/frontendActions'
import { calculateNa, getStoredNilai } from '../../../lib/schoolData'

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

const laporanTypes = [
  { judul: 'Laporan Data Siswa', icon: 'bi-people', desc: 'Rekapitulasi data seluruh siswa aktif', format: ['PDF', 'Excel'] },
  { judul: 'Laporan Data Guru', icon: 'bi-person-badge', desc: 'Rekapitulasi data tenaga pendidik', format: ['PDF', 'Excel'] },
  { judul: 'Laporan Nilai per Kelas', icon: 'bi-file-earmark-text', desc: 'Rekapitulasi nilai siswa per kelas', format: ['PDF', 'Excel'] },
  { judul: 'Laporan Absensi Bulanan', icon: 'bi-clipboard-check', desc: 'Rekapitulasi kehadiran siswa per bulan', format: ['PDF', 'Excel'] },
  { judul: 'Laporan Jadwal Pelajaran', icon: 'bi-calendar-week', desc: 'Jadwal pelajaran seluruh kelas', format: ['PDF', 'Excel'] },
]

const tahunAjaranOptions = ['2025/2026', '2024/2025', '2023/2024']
const semesterOptions = ['Genap', 'Ganjil']

type ReportRow = Record<string, string | number>
type SiswaReportData = { nisn: string; nama: string; kelas: string; jk: string; status: string }
type GuruReportData = { nip: string; nama: string; mapel: string; jk: string; status: string }
type KelasReportData = { nama: string; wali: string; ruang: string; kapasitas: number }

function fileName(title: string, ext: string) {
  return `${title.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'dan')}.${ext}`
}

function valueText(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function filterBySelection(rows: ReportRow[], kelasFilter: string, tahunAjaran: string, semester: string) {
  return rows.filter(row => {
    const matchKelas = !kelasFilter || row.kelas === kelasFilter
    const matchTahun = !row.tahunAjaran || row.tahunAjaran === tahunAjaran
    const matchSemester = !row.semester || row.semester === semester
    return matchKelas && matchTahun && matchSemester
  })
}

function buildReportRows(judul: string, kelasFilter: string, tahunAjaran: string, semester: string) {
  const siswa = readStored<SiswaReportData[]>('siakad_siswa', [])
    .map(item => ({ ...item }))
    .sort((a, b) => a.nisn.localeCompare(b.nisn, 'id-ID', { numeric: true }))
  const guru = readStored<GuruReportData[]>('siakad_guru', [])
  const kelas = readStored<KelasReportData[]>('siakad_kelas', [])
  const siswaByNisn = new Map(siswa.map(item => [item.nisn, item]))
  const nilai = getStoredNilai().map(n => {
    const siswaItem = siswaByNisn.get(n.nisn)
    return {
      nisn: n.nisn,
      nama: siswaItem?.nama || '-',
      kelas: siswaItem?.kelas || n.kelas || '-',
      mapel: n.mapel,
      nh: n.nh,
      tugas: n.tugas || 0,
      pts: n.pts,
      pas: n.pas,
      na: calculateNa(n.nh, n.pts, n.pas, n.tugas || 0),
      tahunAjaran,
      semester,
    }
  })
  const jadwal = Object.entries(readStored<Record<string, string>>('siakad_jadwal', {})).map(([key, mapel]) => {
    const [kelasName, hari, jamKe] = key.split('-')
    return { kelas: kelasName, hari, jamKe, mapel, tahunAjaran, semester }
  })

  const rows =
    judul === 'Laporan Data Siswa' ? siswa.map(item => ({ nisn: item.nisn, nama: item.nama, kelas: item.kelas, jenisKelamin: item.jk, status: item.status, tahunAjaran, semester })) :
    judul === 'Laporan Data Guru' ? guru.map(item => ({ nip: item.nip, nama: item.nama, mapel: item.mapel, jenisKelamin: item.jk, status: item.status })) :
    judul === 'Laporan Nilai per Kelas' ? nilai :
    judul === 'Laporan Jadwal Pelajaran' ? jadwal :
    judul === 'Laporan Absensi Bulanan' ? siswa.map(item => ({ nisn: item.nisn, nama: item.nama, kelas: item.kelas, hadir: 0, sakit: 0, izin: 0, alpa: 0, tahunAjaran, semester })) :
    kelas.map(item => ({ kelas: item.nama, wali: item.wali, ruang: item.ruang, kapasitas: item.kapasitas, tahunAjaran }))

  return filterBySelection(rows as ReportRow[], kelasFilter, tahunAjaran, semester)
}

function exportExcel(judul: string, rows: ReportRow[], filters: { tahunAjaran: string; semester: string; kelas: string }, schoolName: string) {
  const message = judul === 'Laporan Nilai per Kelas' && !filters.kelas ? 'Tidak ada kelas yang dipilih' : 'Tidak ada data'
  const headers = rows[0] ? Object.keys(rows[0]) : ['keterangan']
  const tableRows = rows.length > 0 ? rows.map(row => headers.map(header => valueText(row[header]))) : [[message]]
  const sheetData = [
    [judul],
    [schoolName],
    ['Tahun Ajaran', filters.tahunAjaran],
    ['Semester', filters.semester],
    ['Kelas', filters.kelas || 'Semua Kelas'],
    [],
    headers,
    ...tableRows,
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
  worksheet['!cols'] = headers.map(header => ({ wch: Math.max(14, header.length + 4) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan')
  XLSX.writeFile(workbook, fileName(judul, 'xlsx'))
}

function exportPdf(judul: string, rows: ReportRow[], filters: { tahunAjaran: string; semester: string; kelas: string }, schoolName: string) {
  const message = judul === 'Laporan Nilai per Kelas' && !filters.kelas ? 'Tidak ada kelas yang dipilih' : 'Tidak ada data'
  const headers = rows[0] ? Object.keys(rows[0]) : ['keterangan']
  const tableRows = rows.length > 0 ? rows : [{ keterangan: message }]
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>${judul}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          .muted { color: #6b7280; margin-bottom: 18px; }
          .meta { display: grid; grid-template-columns: 140px 1fr; gap: 6px 12px; margin-bottom: 18px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #d1d5db; padding: 7px 8px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; }
          @media print { body { margin: 18mm; } }
        </style>
      </head>
      <body>
        <h1>${judul}</h1>
        <div class="muted">${schoolName}</div>
        <div class="meta">
          <strong>Tahun Ajaran</strong><span>${filters.tahunAjaran}</span>
          <strong>Semester</strong><span>${filters.semester}</span>
          <strong>Kelas</strong><span>${filters.kelas || 'Semua Kelas'}</span>
        </div>
        <table>
          <thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead>
          <tbody>
            ${tableRows.map(row => `<tr>${headers.map(header => `<td>${valueText(row[header])}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <script>window.addEventListener('load', () => { window.print(); });</script>
      </body>
    </html>
  `
  const popup = window.open('', '_blank')
  if (!popup) {
    alert('Popup diblokir browser. Izinkan popup untuk mencetak PDF.')
    return
  }
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
}

export default function AdminLaporan() {
  const [tahunAjaran, setTahunAjaran] = useState('2025/2026')
  const [semester, setSemester] = useState('Genap')
  const [kelasFilter, setKelasFilter] = useState('')
  const [schoolName, setSchoolName] = useState('SMA Negeri 3 Surabaya')
  const kelasOptions = useMemo(() => readStored<KelasReportData[]>('siakad_kelas', []).map(item => item.nama), [])

  useEffect(() => {
    getSettings()
      .then(data => {
        const namaSekolah = data.settings.sekolah?.namaSekolah
        if (typeof namaSekolah === 'string' && namaSekolah.trim()) setSchoolName(namaSekolah.trim())
      })
      .catch(() => undefined)
  }, [])

  const generateReport = (judul: string, format: string) => {
    const filters = { tahunAjaran, semester, kelas: kelasFilter }
    const rows = judul === 'Laporan Nilai per Kelas' && !kelasFilter
      ? []
      : buildReportRows(judul, kelasFilter, tahunAjaran, semester)
    if (format === 'Excel') exportExcel(judul, rows, filters, schoolName)
    else exportPdf(judul, rows, filters, schoolName)
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header">
        <h1>Laporan & Ekspor</h1>
        <p className="text-muted">Generate dan ekspor laporan akademik</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="form-label">Tahun Ajaran</label>
          <select className="form-select" value={tahunAjaran} onChange={event => setTahunAjaran(event.target.value)}>
            {tahunAjaranOptions.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Semester</label>
          <select className="form-select" value={semester} onChange={event => setSemester(event.target.value)}>
            {semesterOptions.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Kelas</label>
          <select className="form-select" value={kelasFilter} onChange={event => setKelasFilter(event.target.value)}>
            <option value="">Semua Kelas</option>
            {kelasOptions.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="row g-4">
        {laporanTypes.map((lap, idx) => (
          <div className="col-md-6 col-lg-4" key={idx}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, background: 'rgba(59,110,255,0.1)' }}>
                    <i className={`bi ${lap.icon} text-primary fs-4`}></i>
                  </div>
                  <h6 className="mb-0">{lap.judul}</h6>
                </div>
                <p className="text-muted small mb-3">{lap.desc}</p>
                <div className="d-flex gap-2">
                  {lap.format.map(f => (
                    <button key={f} className={`btn btn-sm ${f === 'PDF' ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => generateReport(lap.judul, f)}>
                      <i className={`bi bi-file-earmark${f === 'PDF' ? '-pdf' : '-excel'} me-1`}></i>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
