import { useEffect, useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'
import { defaultSchoolProfile, loadSchoolProfile } from '../../lib/schoolProfile'

export default function TataTertib() {
  const [openAccordion, setOpenAccordion] = useState<string | null>('hak')
  const [profile, setProfile] = useState(defaultSchoolProfile)

  const toggle = (id: string) => setOpenAccordion(openAccordion === id ? null : id)

  useEffect(() => {
    loadSchoolProfile().then(setProfile).catch(() => undefined)
  }, [])

  const sections = [
    {
      id: 'hak',
      title: 'Hak Siswa',
      icon: 'bi-shield-check',
      items: [
        'Mendapatkan pelayanan pendidikan yang bermutu dan berkeadilan.',
        'Menggunakan sarana dan prasarana pembelajaran yang tersedia.',
        'Mendapatkan bimbingan dan konseling dalam proses pembelajaran.',
        'Mengembangkan potensi diri melalui kegiatan ekstrakurikuler.',
        'Menyampaikan pendapat, saran, dan kritik yang membangun.',
        'Mendapatkan perlindungan dari pihak sekolah selama berada di lingkungan sekolah.',
      ]
    },
    {
      id: 'kewajiban',
      title: 'Kewajiban Siswa',
      icon: 'bi-list-check',
      items: [
        'Taat dan patuh terhadap tata tertib, peraturan, dan kebijakan sekolah.',
        'Menjalankan ibadah sesuai dengan agama dan kepercayaan masing-masing.',
        'Mengikuti kegiatan pembelajaran secara teratur dan disiplin.',
        'Menaati aturan seragam sesuai dengan ketentuan yang berlaku.',
        'Menjaga kebersihan, keindahan, dan ketertiban lingkungan sekolah.',
        'Menjaga nama baik diri sendiri, keluarga, dan sekolah.',
        'Membayar SPP dan sumbangan sukarela tepat waktu.',
      ]
    },
    {
      id: 'larangan',
      title: 'Larangan Bagi Siswa',
      icon: 'bi-x-octagon',
      items: [
        'Tidak diperkenankan merokok, minum-minuman keras, dan menggunakan narkoba.',
        'Tidak diperkenankan membawa senjata tajam, senjata api, dan benda berbahaya lainnya.',
        'Tidak diperkenankan bertindak kasar, bullying, dan diskriminasi.',
        'Tidak diperkenankan membawa dan menggunakan ponsel saat pembelajaran berlangsung.',
        'Tidak diperkenankan melakukan tindak kriminal dan perjudian.',
        'Tidak diperkenankan melakukan hubungan intim di luar nikah (pacaran).',
        'Tidak diperkenankan meninggalkan kelas tanpa izin guru.',
      ]
    },
    {
      id: 'sanksi',
      title: 'Sanksi Pelanggaran',
      icon: 'bi-exclamation-triangle',
      items: [
        'Teguran lisan oleh guru atau wali kelas untuk pelanggaran ringan.',
        'Surat peringatan dari pihak sekolah untuk pelanggaran sedang.',
        'Panggilan orang tua/wali untuk pelanggaran berulang.',
        'Skorsing (penghentian sementara) untuk pelanggaran berat.',
        'Dikembalikan kepada orang tua/wali untuk pelanggaran sangat berat.',
      ]
    },
  ]

  return (
    <div>
      <PublicNavbar />
      <section style={{ background: 'var(--inst-navy)', color: 'white', padding: '3rem 0' }}>
        <div className="container">
          <h1 className="mb-2">Tata Tertib</h1>
          <p className="mb-0 opacity-75">Peraturan dan ketentuan yang berlaku di {profile.namaAplikasi}</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {sections.map(section => (
              <div className="col-lg-6" key={section.id}>
                <div className="card border-0 shadow-sm">
                  <div 
                    className="card-header bg-white d-flex align-items-center gap-2 cursor-pointer"
                    onClick={() => toggle(section.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className={`bi ${section.icon} text-primary`}></i>
                    <h6 className="mb-0 flex-grow-1">{section.title}</h6>
                    <i className={`bi ${openAccordion === section.id ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`}></i>
                  </div>
                  {openAccordion === section.id && (
                    <div className="card-body">
                      <ul className="list-group list-group-flush">
                        {section.items.map((item, idx) => (
                          <li className="list-group-item px-0" key={idx}>
                            <div className="d-flex gap-2">
                              <span className="text-primary fw-bold">{idx + 1}.</span>
                              <span>{item}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}
