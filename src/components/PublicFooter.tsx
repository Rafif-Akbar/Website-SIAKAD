import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { defaultSchoolProfile, loadSchoolProfile } from '../lib/schoolProfile'

export default function PublicFooter() {
  const [profile, setProfile] = useState(defaultSchoolProfile)

  useEffect(() => {
    loadSchoolProfile().then(setProfile).catch(() => undefined)
  }, [])

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-3 mb-3">
              <img src={profile.logoUrl} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              <div>
                <h6 className="mb-0">{profile.namaAplikasi}</h6>
                <small>{profile.slogan}</small>
              </div>
            </div>
            <p className="small">
              {profile.alamat}<br />
              Telp: {profile.telepon}<br />
              Email: {profile.email}
            </p>
          </div>
          
          <div className="col-lg-2 col-md-6">
            <h6>Tautan</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/profil">Profil Sekolah</Link></li>
              <li className="mb-2"><Link to="/berita">Berita</Link></li>
              <li className="mb-2"><Link to="/ekstrakurikuler">Ekstrakurikuler</Link></li>
              <li className="mb-2"><Link to="/prestasi">Prestasi</Link></li>
              <li className="mb-2"><Link to="/kalender">Kalender</Link></li>
            </ul>
          </div>
          
          <div className="col-lg-3 col-md-6">
            <h6>Layanan</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/login">Login SIAKAD</Link></li>
              <li className="mb-2"><Link to="/tata-tertib">Tata Tertib</Link></li>
              <li className="mb-2"><Link to="/kontak">Kontak & Lokasi</Link></li>
              <li className="mb-2"><Link to="/bantuan">Bantuan</Link></li>
            </ul>
          </div>
          
          <div className="col-lg-3 col-md-6">
            <h6>Informasi Sekolah</h6>
            <div>
              <small>Akreditasi: {profile.akreditasi}</small><br />
              <small>NSS: {profile.nss}</small>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} {profile.namaAplikasi}. Sistem Informasi Akademik.
          </p>
        </div>
      </div>
    </footer>
  )
}
