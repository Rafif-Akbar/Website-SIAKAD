import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'
import { getPengumuman, type PengumumanApiData } from '../../lib/api'
import { defaultSchoolProfile, loadSchoolProfile } from '../../lib/schoolProfile'

export default function Home() {
  const [pengumuman, setPengumuman] = useState<PengumumanApiData[]>([])
  const [profile, setProfile] = useState(defaultSchoolProfile)

  useEffect(() => {
    loadSchoolProfile().then(setProfile).catch(() => undefined)
    getPengumuman()
      .then(items => setPengumuman(items.filter(item => item.status === 'Dipublikasikan' && ['Semua', 'Siswa', 'Guru'].includes(item.target)).slice(0, 3)))
      .catch(() => setPengumuman([]))
  }, [])

  const dateParts = (tanggal: string) => {
    const parts = tanggal.split(' ')
    return { day: parts[0] || '-', month: parts[1] || '' }
  }

  return (
    <div>
      <PublicNavbar />
      
      {/* Hero Slider */}
      <section className="hero-slider">
        <div id="heroCarousel" className="carousel slide carousel-fade" data-bs-ride="carousel">
          <div className="carousel-inner">
            <div className="carousel-item active">
              <img src="/assets/hero-1.png" alt="Sekolah" />
              <div className="hero-overlay">
                <div className="container">
                  <div className="hero-content">
                    <h1>Selamat Datang di {profile.namaAplikasi}</h1>
                    <p>{profile.slogan}.</p>
                    <Link to="/login" className="btn-hero d-inline-flex align-items-center gap-2">
                      <i className="bi bi-box-arrow-in-right"></i>
                      Login SIAKAD
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="carousel-item">
              <img src="/assets/hero-2.png" alt="Kegiatan" />
              <div className="hero-overlay">
                <div className="container">
                  <div className="hero-content">
                    <h1>Pembelajaran Berkualitas untuk Generasi Emas</h1>
                    <p>Dengan dukungan guru profesional dan fasilitas modern, kami siap membentuk masa depan cerah.</p>
                    <Link to="/profil" className="btn-hero d-inline-flex align-items-center gap-2">
                      <i className="bi bi-info-circle"></i>
                      Profil Sekolah
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="carousel-item">
              <img src="/assets/hero-3.jpeg" alt="Ekstrakurikuler" />
              <div className="hero-overlay">
                <div className="container">
                  <div className="hero-content">
                    <h1>Kembangkan Potensi melalui Ekstrakurikuler</h1>
                    <p>Berbagai kegiatan ekstrakurikuler untuk mengasah bakat dan minat siswa.</p>
                    <Link to="/ekstrakurikuler" className="btn-hero d-inline-flex align-items-center gap-2">
                      <i className="bi bi-trophy"></i>
                      Lihat Ekstrakurikuler
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon"></span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon"></span>
          </button>
          <div className="carousel-indicators">
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active"></button>
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2"></button>
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4 justify-content-center">
            <div className="col-md-6 col-lg-4">
              <Link to="/kalender" className="d-block text-decoration-none">
                <div className="info-card">
                  <div className="icon"><i className="bi bi-calendar-event"></i></div>
                  <h5>Kalender</h5>
                  <p>Kalender bulanan dengan hari libur nasional Indonesia.</p>
                </div>
              </Link>
            </div>
            <div className="col-md-6 col-lg-4">
              <Link to="/berita" className="d-block text-decoration-none">
                <div className="info-card">
                  <div className="icon"><i className="bi bi-megaphone"></i></div>
                  <h5>Pengumuman</h5>
                  <p>Informasi terkini seputar kegiatan sekolah dan akademik.</p>
                </div>
              </Link>
            </div>
            <div className="col-md-6 col-lg-4">
              <Link to="/tata-tertib" className="d-block text-decoration-none">
                <div className="info-card">
                  <div className="icon"><i className="bi bi-journal-text"></i></div>
                  <h5>Tata Tertib</h5>
                  <p>Peraturan dan tata tertib yang berlaku di lingkungan sekolah.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sambutan Kepala Sekolah */}
      <section className="sambutan-section">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-4 text-center">
              <img 
                src={profile.kepsekFoto} 
                alt="Kepala Sekolah" 
                className="img-fluid rounded-3 shadow"
                style={{ maxHeight: 400, objectFit: 'cover' }}
              />
            </div>
            <div className="col-lg-8">
              <div className="quote-icon"><i className="bi bi-quote"></i></div>
              <h3 className="mb-3">Sambutan Kepala Sekolah</h3>
              <p className="lead mb-4">
                "Assalamu'alaikum Wr. Wb. Puji syukur kita panjatkan kehadirat Allah SWT atas limpahan rahmat dan karunia-Nya. {profile.namaAplikasi} berkomitmen untuk terus memberikan pendidikan berkualitas yang berlandaskan iman, takwa, dan ilmu pengetahuan. Kami percaya bahwa setiap siswa memiliki potensi yang unik, dan tugas kami adalah membantu mereka mengembangkan potensi tersebut menjadi prestasi nyata."
              </p>
              <h6 className="fw-bold mb-0">Agus Dwi Pamungkas, S.Si., M.Pd</h6>
              <p className="text-muted">Kepala {profile.namaAplikasi}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pengumuman Terbaru */}
      <section className="py-5">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-8">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Pengumuman Terbaru</h3>
                <Link to="/berita" className="btn btn-outline-primary btn-sm">
                  Lihat Semua <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
              {pengumuman.map((item) => {
                const { day, month } = dateParts(item.tanggal)
                return (
                <div className="pengumuman-item" key={item.id}>
                  <div className="pengumuman-date">
                    <span className="day">{day}</span>
                    <span className="month">{month}</span>
                  </div>
                  <div className="pengumuman-content">
                    <h6>{item.judul}</h6>
                    <p>{item.isi}</p>
                  </div>
                </div>
              )})}
              {pengumuman.length === 0 && (
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center py-4 text-muted">Belum ada pengumuman terbaru.</div>
                </div>
              )}
            </div>
            <div className="col-lg-4">
              <h3 className="mb-4">Tentang SIAKAD</h3>
              <p className="text-muted">
                Sistem Informasi Akademik (SIAKAD) {profile.namaAplikasi} adalah platform digital terintegrasi yang memudahkan pengelolaan data akademik, jadwal pelajaran, nilai siswa, dan berbagai aktivitas sekolah lainnya.
              </p>
              <div className="d-grid gap-2 mt-4">
                <Link to="/login" className="btn btn-primary">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login ke SIAKAD
                </Link>
                <Link to="/bantuan" className="btn btn-outline-secondary">
                  <i className="bi bi-question-circle me-2"></i>
                  Panduan Penggunaan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
