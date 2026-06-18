import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { getSettings, updateSettings } from '../../../lib/api'

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

type SchoolImageField = 'logoUrl' | 'kepsekFoto'

interface ImageEditState {
  src: string
  zoom: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

function cropImage({ src, zoom, offsetX, offsetY, width, height }: ImageEditState) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
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

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    image.onerror = () => reject(new Error('Gagal memproses gambar'))
    image.src = src
  })
}

export default function AdminPengaturan() {
  const [activeTab, setActiveTab] = useState('umum')
  const [accountSearch, setAccountSearch] = useState('')
  const [accounts, setAccounts] = useState<{ username: string; nama: string; role: string; status: string }[]>([])
  const [umum, setUmum] = useState({
    namaAplikasi: 'SMA Negeri 3 Surabaya',
  })
  const [sekolah, setSekolah] = useState({
    namaSekolah: 'SMA Negeri 3 Surabaya',
    kota: 'Surabaya',
    slogan: 'Raih Prestasi, Penuh Motivasi',
    nss: '301056013003',
    npsn: '20533158',
    akreditasi: 'A (Nilai 93)',
    alamat: 'Jl. Memet Sastrowiryo No.54, Komp. Kenjeran, Kec. Bulak, Surabaya, Jawa Timur 60121',
    telepon: '(031) 5678901',
    email: 'seccondgilang@gmail.com',
    visi: 'Unggul, Berakhlak Mulia, Berintegritas, Kritis, Kreatif, dan Peduli Lingkungan serta Berpijak pada Budaya Bangsa.',
    misi: 'Meningkatkan penghayatan dan pengamalan terhadap ajaran agama yang dianutnya.\nMeningkatkan sikap jujur, adil dan bertanggungjawab.\nMelaksanakan pembelajaran kritis, kreatif, komunikatif dan kolaboratif.\nMeningkatkan budaya literasi.\nMembudidayakan sikap gotong royong.\nMelaksanakan pelestarian lingkungan, mencegah kerusakan lingkungan dan mencegah pencemaran lingkungan.',
    sejarah: 'SMA Negeri 3 Surabaya merupakan sekolah menengah atas negeri yang berkomitmen memberikan pendidikan terbaik bagi generasi muda Indonesia. Sekolah terus mengembangkan budaya akademik, karakter, prestasi, dan kepedulian lingkungan.',
    strukturOrganisasi: 'Agus Dwi Pamungkas, S.Si., M.Pd | Kepala Sekolah\nHadi Sunyoto, S.Sos. | Wakasek Kurikulum\nAgus Setiadi, S.Pd | Wakasek Kesiswaan\nAries Afandri, S.Pd | Wakasek Sarana Prasarana\nTheo. Gunawan Wahana, S.S., M.Pd | Wakasek Humas',
    saranaPrasarana: 'Ruang Kelas | 24 ruang kelas dengan kapasitas 32 siswa, dilengkapi AC dan proyektor\nPerpustakaan | Koleksi buku dan fasilitas literasi digital\nLaboratorium Komputer | Komputer dan koneksi internet untuk pembelajaran\nAula | Ruang multifungsi untuk kegiatan sekolah\nLapangan Olahraga | Fasilitas basket, futsal, dan voli\nMasjid | Tempat ibadah dan kegiatan keagamaan',
    logoUrl: '/assets/logo-sman3.png',
    kepsekFoto: '/assets/kepsek.jpg',
  })
  const [imageEdits, setImageEdits] = useState<Partial<Record<SchoolImageField, ImageEditState>>>({})

  useEffect(() => {
    getSettings().then(data => {
      setAccounts(data.accounts)
      if (data.settings.umum?.namaAplikasi) {
        setUmum({ namaAplikasi: String(data.settings.umum.namaAplikasi) })
      }
      if (data.settings.sekolah) setSekolah(current => ({ ...current, ...data.settings.sekolah }))
    }).catch(() => undefined)
  }, [])

  const saveSettings = async (key: 'umum' | 'sekolah') => {
    if (key === 'umum') {
      await updateSettings(key, umum)
      alert('Pengaturan berhasil disimpan dan tersinkron ke database.')
      return
    }

    let nextSekolah = { ...sekolah }
    for (const field of Object.keys(imageEdits) as SchoolImageField[]) {
      const edit = imageEdits[field]
      if (edit) nextSekolah = { ...nextSekolah, [field]: await cropImage(edit) }
    }
    setSekolah(nextSekolah)
    setImageEdits({})
    await updateSettings(key, nextSekolah)
    alert('Pengaturan berhasil disimpan dan tersinkron ke database.')
  }

  const handleImage = (field: SchoolImageField, file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result || '')
      const size = field === 'logoUrl'
        ? { width: 512, height: 512 }
        : { width: 720, height: 900 }
      setSekolah(current => ({ ...current, [field]: src }))
      setImageEdits(current => ({
        ...current,
        [field]: { src, zoom: 1, offsetX: 0, offsetY: 0, ...size },
      }))
    }
    reader.readAsDataURL(file)
  }

  const filteredAccounts = accounts.filter(account => `${account.username} ${account.nama}`.toLowerCase().includes(accountSearch.toLowerCase()))

  const renderImageAdjuster = (field: SchoolImageField, label: string, aspectRatio: string) => {
    const edit = imageEdits[field]
    const preview = edit?.src || sekolah[field]
    return (
      <div className="col-md-6">
        <label className="form-label">{label}</label>
        <input type="file" accept="image/*" className="form-control" onChange={e => handleImage(field, e.target.files?.[0])} />
        <div className="mt-3">
          <div className="rounded overflow-hidden border bg-light" style={{ aspectRatio, position: 'relative', maxWidth: field === 'logoUrl' ? 220 : 260 }}>
            {preview ? (
              <img
                src={preview}
                alt={label}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: edit ? `scale(${edit.zoom}) translate(${edit.offsetX / 8}%, ${edit.offsetY / 8}%)` : undefined,
                  transformOrigin: 'center',
                }}
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted">Belum ada gambar</div>
            )}
          </div>
          {edit && (
            <div className="mt-3">
              <label className="form-label small">Zoom</label>
              <input type="range" className="form-range" min="1" max="3" step="0.05" value={edit.zoom} onChange={e => setImageEdits(current => ({ ...current, [field]: { ...edit, zoom: Number(e.target.value) } }))} />
              <label className="form-label small">Geser Horizontal</label>
              <input type="range" className="form-range" min="-100" max="100" value={edit.offsetX} onChange={e => setImageEdits(current => ({ ...current, [field]: { ...edit, offsetX: Number(e.target.value) } }))} />
              <label className="form-label small">Geser Vertikal</label>
              <input type="range" className="form-range" min="-100" max="100" value={edit.offsetY} onChange={e => setImageEdits(current => ({ ...current, [field]: { ...edit, offsetY: Number(e.target.value) } }))} />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header">
        <h1>Pengaturan Sistem</h1>
        <p className="text-muted">Konfigurasi teknis dan manajemen akun</p>
      </div>

      <div className="row">
        <div className="col-lg-3 mb-4">
          <div className="list-group">
            {[
              { id: 'umum', label: 'Umum', icon: 'bi-gear' },
              { id: 'sekolah', label: 'Data Sekolah', icon: 'bi-building' },
              { id: 'akun', label: 'Manajemen Akun', icon: 'bi-people' }
            ].map(tab => (
              <button 
                key={tab.id}
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`bi ${tab.icon}`}></i>{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="col-lg-9">
          {activeTab === 'umum' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="mb-4">Pengaturan Umum</h6>
                <div className="mb-3">
                  <label className="form-label">Nama Aplikasi</label>
                  <input type="text" className="form-control" value={umum.namaAplikasi} onChange={e => setUmum({ ...umum, namaAplikasi: e.target.value })} />
                </div>
                <button className="btn btn-primary" onClick={() => saveSettings('umum')}><i className="bi bi-check-lg me-2"></i>Simpan Perubahan</button>
              </div>
            </div>
          )}

          {activeTab === 'sekolah' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="mb-4">Data Sekolah</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Nama Sekolah</label>
                    <input type="text" className="form-control" value={sekolah.namaSekolah} onChange={e => setSekolah({ ...sekolah, namaSekolah: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Kota</label>
                    <input type="text" className="form-control" value={sekolah.kota} onChange={e => setSekolah({ ...sekolah, kota: e.target.value })} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Slogan Login</label>
                    <input type="text" className="form-control" value={sekolah.slogan} onChange={e => setSekolah({ ...sekolah, slogan: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">NSS</label>
                    <input type="text" className="form-control" value={sekolah.nss} onChange={e => setSekolah({ ...sekolah, nss: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">NPSN</label>
                    <input type="text" className="form-control" value={sekolah.npsn} onChange={e => setSekolah({ ...sekolah, npsn: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Akreditasi</label>
                    <input type="text" className="form-control" value={sekolah.akreditasi} onChange={e => setSekolah({ ...sekolah, akreditasi: e.target.value })} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Alamat</label>
                    <textarea className="form-control" rows={2} value={sekolah.alamat} onChange={e => setSekolah({ ...sekolah, alamat: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Telepon</label>
                    <input type="text" className="form-control" value={sekolah.telepon} onChange={e => setSekolah({ ...sekolah, telepon: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={sekolah.email} onChange={e => setSekolah({ ...sekolah, email: e.target.value })} />
                  </div>
                  {renderImageAdjuster('logoUrl', 'Logo Website', '1 / 1')}
                  {renderImageAdjuster('kepsekFoto', 'Foto Kepala Sekolah', '4 / 5')}
                  <div className="col-md-12">
                    <label className="form-label">Visi</label>
                    <textarea className="form-control" rows={3} value={sekolah.visi} onChange={e => setSekolah({ ...sekolah, visi: e.target.value })} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Misi</label>
                    <textarea className="form-control" rows={6} value={sekolah.misi} onChange={e => setSekolah({ ...sekolah, misi: e.target.value })} />
                    <small className="text-muted">Tulis satu poin misi per baris.</small>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Sejarah</label>
                    <textarea className="form-control" rows={5} value={sekolah.sejarah} onChange={e => setSekolah({ ...sekolah, sejarah: e.target.value })} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Struktur Organisasi</label>
                    <textarea className="form-control" rows={6} value={sekolah.strukturOrganisasi} onChange={e => setSekolah({ ...sekolah, strukturOrganisasi: e.target.value })} />
                    <small className="text-muted">Format: Nama | Jabatan, satu orang per baris.</small>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Sarana & Prasarana</label>
                    <textarea className="form-control" rows={6} value={sekolah.saranaPrasarana} onChange={e => setSekolah({ ...sekolah, saranaPrasarana: e.target.value })} />
                    <small className="text-muted">Format: Nama Sarana | Deskripsi, satu sarana per baris.</small>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="btn btn-primary" onClick={() => saveSettings('sekolah')}><i className="bi bi-check-lg me-2"></i>Simpan Perubahan</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'akun' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="mb-4">Manajemen Akun Pengguna</h6>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <input type="text" className="form-control w-50" placeholder="Cari akun..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} />
                  <span className="text-muted small">Akun otomatis mengikuti data admin, guru, dan siswa di database.</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                      {filteredAccounts.map(account => (
                        <tr key={account.username}>
                          <td>{account.username}</td>
                          <td>{account.nama}</td>
                          <td><span className={`badge ${account.role === 'admin' ? 'bg-danger' : account.role === 'guru' ? 'bg-primary' : 'bg-info'}`}>{account.role}</span></td>
                          <td><span className={`badge ${account.status === 'Aktif' ? 'bg-success' : 'bg-secondary'}`}>{account.status}</span></td>
                          <td><span className="text-muted small">Kelola dari menu data master</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  )
}
