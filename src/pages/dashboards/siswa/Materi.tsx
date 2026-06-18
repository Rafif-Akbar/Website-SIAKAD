import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { downloadText, readStored, store } from '../../../lib/frontendActions'
import { deleteTugasSubmission, getMateriTugas, getTugasSubmissions, saveTugasSubmission, type MateriTugasApiData } from '../../../lib/api'
import { defaultSiswa, getCurrentUser, getStoredMateriTugas } from '../../../lib/schoolData'

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

export default function SiswaMateri() {
  const user = getCurrentUser()
  const siswa = readStored('siakad_siswa', defaultSiswa).find(item => item.nisn === user.username) || defaultSiswa[0]
  const [filter, setFilter] = useState('all')
  const [submitted, setSubmitted] = useState<string[]>(() => readStored(`siakad_tugas_siswa_${siswa.nisn}`, []))
  const [submissionFiles, setSubmissionFiles] = useState<Record<string, { fileName: string; fileData: string }>>(() => readStored(`siakad_file_tugas_${siswa.nisn}`, {}))
  const [materiData, setMateriData] = useState<MateriTugasApiData[]>(() => getStoredMateriTugas().filter(item => item.kelas === siswa.kelas).map(item => ({
    id: item.id,
    judul: item.judul,
    tipe: item.tipe,
    mapel: item.mapel,
    kelas: item.kelas,
    guruNip: '',
    guru: item.guru,
    tanggal: item.tanggal,
    deskripsi: item.deskripsi,
    fileName: item.file,
    deadline: item.deadline,
  })))
  const filtered = filter === 'all' ? materiData : materiData.filter(m => m.tipe === filter)
  const canDeleteSubmission = (item: MateriTugasApiData) => {
    if (!item.deadline) return true
    return new Date().toISOString().slice(0, 10) <= item.deadline
  }

  useEffect(() => {
    getMateriTugas({ kelas: siswa.kelas })
      .then(setMateriData)
      .catch(() => undefined)

    getTugasSubmissions({ nisn: siswa.nisn })
      .then(items => {
        const files = Object.fromEntries(items.map(item => [item.tugasId, { fileName: item.fileName, fileData: item.fileData }]))
        const ids = items.map(item => item.tugasId)
        setSubmissionFiles(files)
        setSubmitted(ids)
        store(`siakad_file_tugas_${siswa.nisn}`, files)
        store(`siakad_tugas_siswa_${siswa.nisn}`, ids)
      })
      .catch(() => undefined)
  }, [siswa.kelas, siswa.nisn])

  const downloadMateri = (item: MateriTugasApiData) => {
    if (item.fileData && item.fileName) {
      const link = document.createElement('a')
      link.href = item.fileData
      link.download = item.fileName
      link.click()
      return
    }

    downloadText(item.fileName || 'materi.txt', `${item.judul}\n\n${item.deskripsi}`)
  }

  const viewMateri = (judul: string, deskripsi: string) => {
    alert(`${judul}\n\n${deskripsi}`)
  }

  const uploadTugas = (id: string, file?: File) => {
    if (!file) {
      alert('Pilih file tugas dari perangkat terlebih dahulu')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const fileData = String(reader.result)
      try {
        await saveTugasSubmission({
          tugasId: id,
          nisn: siswa.nisn,
          nama: siswa.nama,
          kelas: siswa.kelas,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileData,
        })

        const files = { ...submissionFiles, [id]: { fileName: file.name, fileData } }
        setSubmissionFiles(files)
        store(`siakad_file_tugas_${siswa.nisn}`, files)
        const next = Array.from(new Set([...submitted, id]))
        setSubmitted(next)
        store(`siakad_tugas_siswa_${siswa.nisn}`, next)
        alert('File tugas berhasil diupload')
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Gagal mengupload file tugas')
      }
    }
    reader.readAsDataURL(file)
  }

  const downloadSubmission = (id: string) => {
    const item = submissionFiles[id]
    if (!item) return
    const link = document.createElement('a')
    link.href = item.fileData
    link.download = item.fileName
    link.click()
  }

  const removeSubmission = async (item: MateriTugasApiData) => {
    if (!canDeleteSubmission(item)) {
      alert('Tugas tidak dapat dihapus karena sudah melewati deadline')
      return
    }
    if (!window.confirm('Anda yakin ingin mengapus tugas Anda?')) return

    try {
      await deleteTugasSubmission(item.id, siswa.nisn)
      const files = { ...submissionFiles }
      delete files[item.id]
      setSubmissionFiles(files)
      store(`siakad_file_tugas_${siswa.nisn}`, files)
      const next = submitted.filter(id => id !== item.id)
      setSubmitted(next)
      store(`siakad_tugas_siswa_${siswa.nisn}`, next)
      alert('Pengumpulan tugas berhasil dihapus')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menghapus pengumpulan tugas')
    }
  }

  const markSubmitted = (id: string) => {
    const next = Array.from(new Set([...submitted, id]))
    setSubmitted(next)
    store(`siakad_tugas_siswa_${siswa.nisn}`, next)
    alert('Tugas berhasil ditandai sebagai dikumpulkan')
  }

  return (
    <DashboardLayout role="siswa" userName={siswa.nama} navSections={navSections}>
      <div className="page-header">
        <h1>Materi & Tugas</h1>
        <p className="text-muted">Materi dan tugas kelas {siswa.kelas} dari guru</p>
      </div>

      <div className="d-flex gap-2 mb-4">
        {[{ id: 'all', label: 'Semua' }, { id: 'materi', label: 'Materi' }, { id: 'tugas', label: 'Tugas' }].map(f => (
          <button key={f.id} className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="row g-3">
        {filtered.map(m => {
          const isSubmitted = submitted.includes(m.id)
          return (
            <div className="col-md-6" key={m.id}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`badge ${m.tipe === 'materi' ? 'bg-primary' : 'bg-warning text-dark'}`} style={{ fontSize: '0.7rem' }}>
                      {m.tipe === 'materi' ? 'MATERI' : 'TUGAS'}
                    </span>
                    <small className="text-muted">{m.tanggal}</small>
                  </div>
                  <h6 className="mb-1">{m.judul}</h6>
                  <p className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>
                    <i className="bi bi-book me-1"></i>{m.mapel} | <i className="bi bi-person me-1"></i>{m.guru}
                  </p>
                  <p className="small text-muted">{m.deskripsi}</p>
                  {m.tipe === 'materi' ? (
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={() => downloadMateri(m)}>
                        <i className="bi bi-download me-1"></i>Download
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => viewMateri(m.judul, m.deskripsi)}>
                        <i className="bi bi-eye me-1"></i>Lihat
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">Deadline: {m.deadline}</small>
                        <span className={`badge ${isSubmitted ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.7rem' }}>{isSubmitted ? 'Sudah dikumpulkan' : 'Belum dikumpulkan'}</span>
                      </div>
                      <input type="file" className="form-control form-control-sm mb-2" onChange={e => uploadTugas(m.id, e.target.files?.[0])} />
                      {submissionFiles[m.id] && (
                        <>
                          <button className="btn btn-outline-success btn-sm me-2" onClick={() => downloadSubmission(m.id)}>
                            <i className="bi bi-download me-1"></i>File Upload
                          </button>
                          {canDeleteSubmission(m) && (
                            <button className="btn btn-outline-danger btn-sm me-2" onClick={() => removeSubmission(m)}>
                              <i className="bi bi-trash me-1"></i>Hapus Tugas
                            </button>
                          )}
                        </>
                      )}
                      <button className="btn btn-outline-primary btn-sm" onClick={() => markSubmitted(m.id)}>
                        <i className="bi bi-check2-circle me-1"></i>Tandai Terkumpul
                      </button>
                      {m.fileName && (
                        <button className="btn btn-outline-secondary btn-sm ms-2" onClick={() => downloadMateri(m)}>
                          <i className="bi bi-download me-1"></i>File Tugas
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5 text-muted">Belum ada materi atau tugas untuk kelas ini.</div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
