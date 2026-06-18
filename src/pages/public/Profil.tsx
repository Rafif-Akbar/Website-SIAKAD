import { useEffect, useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'
import { getSettings } from '../../lib/api'
import { defaultSchoolProfile } from '../../lib/schoolProfile'

const defaultProfil = {
  namaAplikasi: defaultSchoolProfile.namaAplikasi,
  visi: 'Unggul, Berakhlak Mulia, Berintegritas, Kritis, Kreatif, dan Peduli Lingkungan serta Berpijak pada Budaya Bangsa.',
  misi: 'Meningkatkan penghayatan dan pengamalan terhadap ajaran agama yang dianutnya.\nMeningkatkan sikap jujur, adil dan bertanggungjawab.\nMelaksanakan pembelajaran kritis, kreatif, komunikatif dan kolaboratif.\nMeningkatkan budaya literasi.\nMembudidayakan sikap gotong royong.\nMelaksanakan pelestarian lingkungan, mencegah kerusakan lingkungan dan mencegah pencemaran lingkungan.',
  sejarah: 'SMA Negeri 3 Surabaya merupakan sekolah menengah atas negeri yang berkomitmen memberikan pendidikan terbaik bagi generasi muda Indonesia. Sekolah terus mengembangkan budaya akademik, karakter, prestasi, dan kepedulian lingkungan.',
  strukturOrganisasi: 'Agus Dwi Pamungkas, S.Si., M.Pd | Kepala Sekolah\nHadi Sunyoto, S.Sos. | Wakasek Kurikulum\nAgus Setiadi, S.Pd | Wakasek Kesiswaan\nAries Afandri, S.Pd | Wakasek Sarana Prasarana\nTheo. Gunawan Wahana, S.S., M.Pd | Wakasek Humas',
  saranaPrasarana: 'Ruang Kelas | 24 ruang kelas dengan kapasitas 32 siswa, dilengkapi AC dan proyektor\nPerpustakaan | Koleksi buku dan fasilitas literasi digital\nLaboratorium Komputer | Komputer dan koneksi internet untuk pembelajaran\nAula | Ruang multifungsi untuk kegiatan sekolah\nLapangan Olahraga | Fasilitas basket, futsal, dan voli\nMasjid | Tempat ibadah dan kegiatan keagamaan',
}

function splitLines(value: string) {
  return value.split('\n').map(line => line.trim()).filter(Boolean)
}

function splitPair(line: string) {
  const [name, ...detail] = line.split('|').map(item => item.trim())
  return { name, desc: detail.join(' | ') }
}

function replaceDefaultSchoolName(value: string, schoolName: string) {
  return value
    .replaceAll('SMA Negeri 3 Surabaya', schoolName)
    .replaceAll('SMAN 3 Surabaya', schoolName)
}

export default function Profil() {
  const [activeTab, setActiveTab] = useState('visi')
  const [profil, setProfil] = useState(defaultProfil)

  const tabs = [
    { id: 'visi', label: 'Visi & Misi' },
    { id: 'sejarah', label: 'Sejarah' },
    { id: 'struktur', label: 'Struktur Organisasi' },
    { id: 'sarana', label: 'Sarana & Prasarana' },
  ]

  useEffect(() => {
    getSettings().then(data => {
      const namaAplikasi = typeof data.settings.umum?.namaAplikasi === 'string' && data.settings.umum.namaAplikasi.trim()
        ? data.settings.umum.namaAplikasi.trim()
        : defaultSchoolProfile.namaAplikasi
      if (data.settings.sekolah) setProfil(current => ({ ...current, ...data.settings.sekolah, namaAplikasi }))
      else setProfil(current => ({ ...current, namaAplikasi }))
    }).catch(() => undefined)
  }, [])

  const misiData = splitLines(profil.misi)
  const strukturData = splitLines(profil.strukturOrganisasi).map(splitPair)
  const saranaData = splitLines(profil.saranaPrasarana).map((line, idx) => ({
    icon: ['bi-building', 'bi-book', 'bi-pc-display', 'bi-easel', 'bi-circle', 'bi-moon'][idx % 6],
    ...splitPair(line),
  }))

  return (
    <div>
      <PublicNavbar />
      
      {/* Page Header */}
      <section style={{ background: 'var(--inst-navy)', color: 'white', padding: '3rem 0' }}>
        <div className="container">
          <h1 className="mb-2">Profil Sekolah</h1>
          <p className="mb-0 opacity-75">Mengenal lebih dekat {profil.namaAplikasi}</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          {/* Tab Navigation */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Visi & Misi */}
          {activeTab === 'visi' && (
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'rgba(59,110,255,0.1)' }}>
                        <i className="bi bi-eye text-primary fs-4"></i>
                      </div>
                      <h4 className="mb-0">Visi</h4>
                    </div>
                    <p className="lead">
                      "{profil.visi}"
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'rgba(16,185,129,0.1)' }}>
                        <i className="bi bi-bullseye text-success fs-4"></i>
                      </div>
                      <h4 className="mb-0">Misi</h4>
                    </div>
                    <ol className="mb-0">
                      {misiData.map((item, idx) => <li className="mb-2" key={idx}>{item}</li>)}
                    </ol>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <h5 className="mb-3">Motto</h5>
                    <div className="row g-3">
                      {[
                        { title: 'Berkarakter', desc: 'Di belakang memberikan dorongan' },
                        { title: 'Berprestasi', desc: 'Di depan memberi teladan' },
                        { title: 'Berintegritas', desc: 'Di tengah membangun semangat' },
                      ].map((motto, idx) => (
                        <div className="col-md-4" key={idx}>
                          <div className="p-3 rounded" style={{ background: 'var(--inst-bg)' }}>
                            <h6 className="text-primary mb-1">{motto.title}</h6>
                            <p className="mb-0 small text-muted">{motto.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sejarah */}
          {activeTab === 'sejarah' && (
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="text-primary mb-3">Sejarah Singkat</h4>

                    {splitLines(replaceDefaultSchoolName(profil.sejarah, profil.namaAplikasi)).map((paragraph, idx, rows) => (
                      <p className={idx === rows.length - 1 ? 'mb-0' : ''} key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Struktur Organisasi */}
          {activeTab === 'struktur' && (
            <div className="text-center">
              <div className="card border-0 shadow-sm mb-4 mx-auto" style={{ maxWidth: 400 }}>
                <div className="card-body p-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white mb-3" style={{ width: 64, height: 64 }}>
                    <i className="bi bi-person-fill fs-2"></i>
                  </div>
                  <h6 className="mb-1">{strukturData[0]?.name || 'Kepala Sekolah'}</h6>
                  <p className="text-muted mb-0 small">{strukturData[0]?.desc || 'Kepala Sekolah'}</p>
                </div>
              </div>
              
              <div className="row g-3 justify-content-center mb-4">
                {strukturData.slice(1).map((item, idx) => (
                  <div className="col-md-3" key={idx}>
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body p-3">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary text-white mb-2" style={{ width: 48, height: 48 }}>
                          <i className="bi bi-person-fill fs-4"></i>
                        </div>
                        <h6 className="mb-1 small">{item.name}</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sarana & Prasarana */}
          {activeTab === 'sarana' && (
            <div className="row g-3">
              {saranaData.map((item, idx) => (
                <div className="col-md-6 col-lg-4 col-xl-3" key={idx}>
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, background: 'rgba(59,110,255,0.1)', minWidth: 48 }}>
                          <i className={`bi ${item.icon} text-primary fs-4`}></i>
                        </div>
                        <div>
                          <h6 className="mb-1">{item.name}</h6>
                          <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
