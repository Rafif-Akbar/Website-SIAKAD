import { useEffect, useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'
import { getPrestasi, type PrestasiApiData } from '../../lib/api'

export default function Prestasi() {
  const [filter, setFilter] = useState('all')
  const [prestasiData, setPrestasiData] = useState<PrestasiApiData[]>([])

  useEffect(() => {
    getPrestasi()
      .then(setPrestasiData)
      .catch(() => setPrestasiData([]))
  }, [])

  const filteredPrestasi = filter === 'all' ? prestasiData : prestasiData.filter(p => p.kategori === filter)

  const categoryIcons: Record<string, string> = {
    'akademik': 'bi-mortarboard',
    'non-akademik': 'bi-trophy',
  }

  return (
    <div>
      <PublicNavbar />
      <section style={{ background: 'var(--inst-navy)', color: 'white', padding: '3rem 0' }}>
        <div className="container">
          <h1 className="mb-2">Prestasi</h1>
          <p className="mb-0 opacity-75">Berbagai capaian prestasi siswa, guru, dan sekolah</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="d-flex gap-2 mb-4">
            {[
              { id: 'all', label: 'Semua Prestasi' },
              { id: 'akademik', label: 'Akademik' },
              { id: 'non-akademik', label: 'Non-Akademik' },
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

          <div className="row g-4">
            {filteredPrestasi.map(item => (
              <div className="col-md-6 col-lg-4" key={item.id}>
                <div className="prestasi-card h-100">
                  <div className="prestasi-img">
                    {item.gambar ? (
                      <img src={item.gambar} alt={item.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className={`bi ${categoryIcons[item.kategori] || 'bi-award'}`}></i>
                    )}
                  </div>
                  <div className="prestasi-body">
                    <div className="category">{item.kategori.toUpperCase()}</div>
                    <h6>{item.judul}</h6>
                    <p>{item.deskripsi}</p>
                    <span className="year">
                      <i className="bi bi-calendar3 me-1"></i>
                      {item.tanggal}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {filteredPrestasi.length === 0 && (
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center py-5 text-muted">Belum ada prestasi yang dipublikasikan.</div>
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
