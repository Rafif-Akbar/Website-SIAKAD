import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'

export default function Bantuan() {
  const [openItem, setOpenItem] = useState<string | null>('q1')
  const [searchTerm, setSearchTerm] = useState('')

  const toggle = (id: string) => setOpenItem(openItem === id ? null : id)

  const faqData = [
    {
      id: 'q1',
      q: 'Bagaimana cara login ke SIAKAD?',
      a: 'Untuk login ke SIAKAD, klik tombol "Login" di pojok kanan atas halaman. Masukkan NISN (untuk siswa) atau NIP (untuk guru) beserta password yang telah diberikan oleh admin sekolah. Pilih peran (Siswa/Guru/Admin) sesuai dengan status Anda.',
      category: 'umum'
    },
    {
      id: 'q2',
      q: 'Saya lupa password, apa yang harus dilakukan?',
      a: 'Jika Anda lupa password, hubungi admin sekolah atau guru wali kelas Anda. Mereka akan membantu reset password Anda. Untuk siswa, password baru akan diberikan melalui guru wali kelas masing-masing.',
      category: 'siswa'
    },
    {
      id: 'q3',
      q: 'Bagaimana cara melihat jadwal pelajaran?',
      a: 'Setelah login, pilih menu "Jadwal Pelajaran" di sidebar dashboard. Jadwal akan ditampilkan secara otomatis berdasarkan kelas Anda (untuk siswa) atau jadwal mengajar Anda (untuk guru).',
      category: 'siswa'
    },
    {
      id: 'q4',
      q: 'Bagaimana cara melihat nilai?',
      a: 'Login sebagai siswa, lalu pilih menu "Riwayat Nilai". Nilai akan ditampilkan per semester dengan rincian nilai harian, PTS, PAS, dan nilai akhir untuk setiap mata pelajaran.',
      category: 'siswa'
    },
    {
      id: 'q5',
      q: 'Bagaimana cara guru menginput nilai?',
      a: 'Login sebagai guru, pilih menu "Input Nilai Siswa". Pilih tahun ajaran, kelas, dan mata pelajaran yang akan dinilai. Masukkan nilai NH, PTS, dan PAS untuk setiap siswa. Nilai akhir akan dihitung otomatis.',
      category: 'guru'
    },
    {
      id: 'q6',
      q: 'Bagaimana cara menginput absensi?',
      a: 'Login sebagai guru, pilih menu "Input Absensi". Pilih kelas dan tanggal, lalu tandai kehadiran siswa (Hadir, Sakit, Izin, atau Alpa). Data absensi akan tersimpan secara otomatis.',
      category: 'guru'
    },
    {
      id: 'q7',
      q: 'Siapa yang dapat mengakses dashboard admin?',
      a: 'Dashboard admin hanya dapat diakses oleh staf tata usaha dan kepala sekolah yang memiliki akun admin. Admin memiliki kewenangan penuh untuk mengelola data siswa, guru, jadwal, dan pengaturan sistem.',
      category: 'admin'
    },
    {
      id: 'q8',
      q: 'Bagaimana cara admin menambahkan data siswa baru?',
      a: 'Login sebagai admin, pilih menu "Kelola Data Siswa", klik tombol "Tambah Data". Isi formulir dengan data lengkap siswa termasuk NISN, nama, kelas, dan data pribadi lainnya. Klik "Simpan" untuk menyimpan data.',
      category: 'admin'
    },
    {
      id: 'q9',
      q: 'Apakah SIAKAD dapat diakses melalui HP?',
      a: 'Ya, SIAKAD dapat diakses melalui browser pada perangkat mobile (smartphone/tablet). Tampilan akan menyesuaikan dengan ukuran layar perangkat Anda untuk kenyamanan penggunaan.',
      category: 'umum'
    },
    {
      id: 'q10',
      q: 'Bagaimana cara mencetak raport?',
      a: 'Login sebagai siswa, pilih menu "Riwayat Nilai", lalu klik tombol "Cetak Raport" yang tersedia di halaman nilai. Raport akan ditampilkan dalam format siap cetak (PDF-friendly).',
      category: 'siswa'
    },
  ]

  const filteredFaq = searchTerm 
    ? faqData.filter(f => f.q.toLowerCase().includes(searchTerm.toLowerCase()) || f.a.toLowerCase().includes(searchTerm.toLowerCase()))
    : faqData

  return (
    <div>
      <PublicNavbar />
      <section style={{ background: 'var(--inst-navy)', color: 'white', padding: '3rem 0' }}>
        <div className="container">
          <h1 className="mb-2">Bantuan</h1>
          <p className="mb-0 opacity-75">Panduan penggunaan SIAKAD dan jawaban pertanyaan umum</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          {/* Search */}
          <div className="row mb-5">
            <div className="col-lg-6 mx-auto">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control form-control-siakad border-start-0"
                  placeholder="Cari pertanyaan..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* FAQ List */}
            <div className="col-lg-8">
              <h5 className="mb-4">Pertanyaan yang Sering Diajukan</h5>
              {filteredFaq.map(item => (
                <div className="card border-0 shadow-sm mb-3" key={item.id}>
                  <div 
                    className="card-body d-flex gap-3 align-items-start"
                    onClick={() => toggle(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="mb-0">{item.q}</h6>
                        <i className={`bi ${openItem === item.id ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted ms-2`}></i>
                      </div>
                      {openItem === item.id && (
                        <div className="mt-3 text-muted">
                          <span className="badge bg-primary bg-opacity-10 text-primary mb-2" style={{ fontSize: '0.7rem' }}>
                            {item.category.toUpperCase()}
                          </span>
                          <p className="mb-0">{item.a}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredFaq.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-search fs-1 mb-3 d-block"></i>
                  Tidak ditemukan hasil untuk &quot;{searchTerm}&quot;
                </div>
              )}
            </div>

            {/* Quick Contact */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4 text-center">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 64, height: 64, background: 'rgba(59,110,255,0.1)' }}>
                    <i className="bi bi-headset text-primary fs-2"></i>
                  </div>
                  <h6>Masih Butuh Bantuan?</h6>
                  <p className="text-muted small">Tim support kami siap membantu Anda dengan pertanyaan teknis terkait SIAKAD.</p>
                  <div className="d-grid gap-2">
                    <a href="#" className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-whatsapp me-2"></i>
                      WhatsApp
                    </a>
                    <Link to="/kontak" className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-envelope me-2"></i>
                      Kirim Email
                    </Link>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <h6 className="mb-3">Kategori Panduan</h6>
                  <div className="list-group list-group-flush">
                    {[
                      { icon: 'bi-person', label: 'Panduan Siswa', desc: 'Login, nilai, jadwal' },
                      { icon: 'bi-person-badge', label: 'Panduan Guru', desc: 'Input nilai, absensi' },
                      { icon: 'bi-shield-lock', label: 'Panduan Admin', desc: 'Kelola data sistem' },
                      { icon: 'bi-gear', label: 'Pengaturan Akun', desc: 'Password, profil' },
                    ].map((item, idx) => (
                      <a href="#" className="list-group-item list-group-item-action d-flex gap-3 px-0" key={idx}>
                        <i className={`bi ${item.icon} text-primary mt-1`}></i>
                        <div>
                          <h6 className="mb-0 small">{item.label}</h6>
                          <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}
