import { useEffect, useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'
import { getPengumuman, type PengumumanApiData } from '../../lib/api'

export default function Berita() {
  const [filter, setFilter] = useState('all')
  const [pengumuman, setPengumuman] = useState<PengumumanApiData[]>([])

  useEffect(() => {
    getPengumuman()
      .then(setPengumuman)
      .catch(() => setPengumuman([]))
  }, [])

  const beritaData = pengumuman
    .filter(item => item.status === 'Dipublikasikan' && ['Semua', 'Siswa', 'Guru'].includes(item.target))
    .map(item => ({
      category: item.kategori.toLowerCase(),
      title: item.judul,
      date: item.tanggal,
      excerpt: item.isi,
    }))

  const filteredBerita = filter === 'all' ? beritaData : beritaData.filter(b => b.category === filter)

  return (
    <div>
      <PublicNavbar />
      <section style={{ background: 'var(--inst-navy)', color: 'white', padding: '3rem 0' }}>
        <div className="container">
          <h1 className="mb-2">Berita & Pengumuman</h1>
          <p className="mb-0 opacity-75">Informasi terkini seputar kegiatan dan akademik sekolah</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          {/* Filter */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'akademik', label: 'Akademik' },
              { id: 'kegiatan', label: 'Kegiatan' },
              { id: 'umum', label: 'Umum' },
            ].map(f => (
              <button
                key={f.id}
                className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* News Grid */}
          <div className="row g-4">
            {filteredBerita.map((item, idx) => (
              <div className="col-md-6 col-lg-4" key={idx}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <span className={`badge rounded-pill mb-2 ${
                      item.category === 'akademik' ? 'bg-primary' :
                      item.category === 'kegiatan' ? 'bg-success' :
                      item.category === 'prestasi' ? 'bg-warning text-dark' : 'bg-secondary'
                    }`} style={{ fontSize: '0.7rem' }}>
                      {item.category.toUpperCase()}
                    </span>
                    <h6 className="card-title">{item.title}</h6>
                    <p className="card-text text-muted small">{item.excerpt}</p>
                    <div className="d-flex align-items-center text-muted" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-calendar3 me-2"></i>
                      {item.date}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredBerita.length === 0 && (
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center py-5 text-muted">Belum ada berita atau pengumuman.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}
