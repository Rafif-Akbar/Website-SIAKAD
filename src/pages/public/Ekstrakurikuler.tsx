import { useEffect, useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'
import { getSettings } from '../../lib/api'

interface EkskulPublicData {
  id?: string
  nama?: string
  name?: string
  deskripsi?: string
  desc?: string
  kategori?: string
  category?: string
  gambar?: string
  image?: string
  status?: string
}

const legacyDefaultIds = new Set(['basket', 'paduan-suara', 'karya-ilmiah'])

export default function Ekstrakurikuler() {
  const [filter, setFilter] = useState('all')

  const [ekskulData, setEkskulData] = useState<EkskulPublicData[]>([])

  useEffect(() => {
    getSettings().then(response => {
      const ekskul = response.settings.ekstrakurikuler?.items
      if (Array.isArray(ekskul)) setEkskulData((ekskul as EkskulPublicData[]).filter(item => !item.id || !legacyDefaultIds.has(item.id)))
    }).catch(() => undefined)
  }, [])

  const normalizeCategory = (value?: string) => (value || '').toLowerCase()
  const availableCategories = [
    { id: 'all', label: 'Semua' },
    ...Array.from(new Set(ekskulData.filter(item => item.status !== 'Arsip').map(item => item.kategori || item.category).filter(Boolean)))
      .map(item => ({ id: normalizeCategory(String(item)), label: String(item) })),
  ]

  const filteredEkskul =
    filter === 'all'
      ? ekskulData.filter(e => e.status !== 'Arsip')
      : ekskulData.filter(e => e.status !== 'Arsip' && normalizeCategory(e.kategori || e.category) === filter)

  return (
    <>
      <style>{`
        .ekskul-card {
          border-radius: 14px;
          overflow: hidden;
          background: white;
          box-shadow: 0 6px 18px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .ekskul-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }

        .ekskul-image-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
        }

        .ekskul-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .ekskul-card:hover .ekskul-img {
          transform: scale(1.08);
        }

        .ekskul-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
        }

        .ekskul-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: #2563eb;
          color: white;
          font-size: 0.7rem;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .ekskul-body {
          padding: 1rem;
        }

        .ekskul-title {
          font-weight: 600;
          margin-bottom: 6px;
        }

        .ekskul-desc {
          font-size: 0.85rem;
          color: #6b7280;
        }
      `}</style>

      <PublicNavbar />

      <section className="py-5">
        <div className="container">

          {/* FILTER */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {availableCategories.map(cat => (
              <button
                key={cat.id}
                className={`btn btn-sm ${filter === cat.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* GRID */}
          <div className="row g-4">
            {filteredEkskul.map((item, idx) => (
              <div className="col-md-6 col-lg-4 col-xl-3" key={idx}>
                <div className="ekskul-card">

                  <div className="ekskul-image-wrapper">
                    <img src={item.gambar || item.image || '/img/placeholder-school.jpg'} alt={item.nama || item.name} className="ekskul-img" />
                    <div className="ekskul-overlay"></div>
                    <span className="ekskul-badge">{(item.kategori || item.category || '').toUpperCase()}</span>
                  </div>

                  <div className="ekskul-body">
                    <h6 className="ekskul-title">{item.nama || item.name}</h6>
                    <p className="ekskul-desc">{item.deskripsi || item.desc}</p>
                  </div>

                </div>
              </div>
            ))}
            {filteredEkskul.length === 0 && (
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center py-5 text-muted">Belum ada ekstrakurikuler yang ditambahkan.</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      <PublicFooter />
    </>
  )
}
