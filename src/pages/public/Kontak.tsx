import { useEffect, useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'
import { defaultSchoolProfile, loadSchoolProfile } from '../../lib/schoolProfile'

export default function Kontak() {
  const [profile, setProfile] = useState(defaultSchoolProfile)

  useEffect(() => {
    loadSchoolProfile().then(setProfile).catch(() => undefined)
  }, [])

  return (
    <div>
      <PublicNavbar />
      <section style={{ background: 'var(--inst-navy)', color: 'white', padding: '3rem 0' }}>
        <div className="container">
          <h1 className="mb-2">Kontak & Lokasi</h1>
          <p className="mb-0 opacity-75">Hubungi kami atau kunjungi lokasi sekolah</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {/* Contact Info */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h5 className="mb-4">Informasi Kontak</h5>
                  
                  <div className="d-flex gap-3 mb-4">
                    <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 44, height: 44, background: 'rgba(59,110,255,0.1)', minWidth: 44 }}>
                      <i className="bi bi-geo-alt text-primary fs-5"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Alamat</h6>
                      <p className="text-muted mb-0 small">{profile.alamat}</p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 mb-4">
                    <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 44, height: 44, background: 'rgba(59,110,255,0.1)', minWidth: 44 }}>
                      <i className="bi bi-telephone text-primary fs-5"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Telepon</h6>
                      <p className="text-muted mb-0 small">{profile.telepon}</p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 mb-4">
                    <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 44, height: 44, background: 'rgba(59,110,255,0.1)', minWidth: 44 }}>
                      <i className="bi bi-envelope text-primary fs-5"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Email</h6>
                      <p className="text-muted mb-0 small">{profile.email}</p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 mb-4">
                    <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 44, height: 44, background: 'rgba(59,110,255,0.1)', minWidth: 44 }}>
                      <i className="bi bi-clock text-primary fs-5"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Jam Operasional</h6>
                      <p className="text-muted mb-0 small">Senin - Jumat: 07.00 - 15.30 WIB</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h6 className="mb-3">Media Sosial</h6>
                    <div className="d-flex gap-2">
                      {['facebook', 'instagram', 'twitter-x', 'youtube'].map(sosmed => (
                        <a key={sosmed} href={`https://${sosmed === 'twitter-x' ? 'x' : sosmed}.com`} className="d-flex align-items-center justify-content-center rounded text-white" style={{ width: 40, height: 40, background: 'var(--inst-accent)' }}>
                          <i className={`bi bi-${sosmed}`}></i>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-0">
                  <div style={{ height: 350, background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.375rem 0.375rem 0 0' }}>
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.98793492434!2d112.78727727454559!3d-7.242210971132986!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7f9c11036bb11%3A0x189ca0a52b3c546e!2sSMA%20Negeri%203%20Surabaya!5e0!3m2!1sid!2sid!4v1776861061986!5m2!1sid!2sid%22%20width=%22600%22%20height=%22450%22%20style=%22border:0;%22%20allowfullscreen=%22%22%20loading=%22lazy%22%20referrerpolicy=%22no-referrer-when-downgrade"
                      width="100%"
                      height="350"
                      style={{ border: 0, borderRadius: '0.375rem 0.375rem 0 0' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Lokasi ${profile.namaSekolah}`}
                    />
                  </div>
                  <div className="p-4">
                    <h2>Lokasi Sekolah</h2>
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
