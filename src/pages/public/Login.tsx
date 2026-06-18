import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, requestPasswordReset } from '../../lib/api'
import { readStored } from '../../lib/frontendActions'
import { defaultSchoolProfile, loadSchoolProfile } from '../../lib/schoolProfile'
import { defaultGuru, defaultSiswa } from '../../lib/schoolData'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('siswa')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [profile, setProfile] = useState(defaultSchoolProfile)
  const navigate = useNavigate()

  useEffect(() => {
    loadSchoolProfile().then(setProfile).catch(() => undefined)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('NISN/NIP dan password wajib diisi')
      return
    }

    try {
      setLoading(true)
      const { user } = await login({ username, password, role })
      localStorage.setItem('siakad_user', JSON.stringify(user))
      navigate(`/${user.role}/dashboard`)
    } catch (err) {
      const siswa = readStored('siakad_siswa', defaultSiswa).find(item => item.nisn === username && item.password === password)
      const guru = readStored('siakad_guru', defaultGuru).find(item => item.nip === username && item.password === password)
      if (role === 'siswa' && siswa) {
        if (!['Aktif', 'Lulus'].includes(siswa.status)) {
          setError('Akun Siswa Anda saat ini tidak aktif. Silakan hubungi administrator sekolah untuk informasi lebih lanjut.')
          return
        }
        const user = { id: 0, username: siswa.nisn, role: 'siswa', name: siswa.nama }
        localStorage.setItem('siakad_user', JSON.stringify(user))
        navigate('/siswa/dashboard')
        return
      }
      if (role === 'guru' && guru) {
        if (!['Aktif', 'Cuti'].includes(guru.status)) {
          setError('Akun Guru Anda saat ini tidak aktif. Silakan hubungi administrator sekolah untuk informasi lebih lanjut.')
          return
        }
        const user = { id: 0, username: guru.nip, role: 'guru', name: guru.nama }
        localStorage.setItem('siakad_user', JSON.stringify(user))
        navigate('/guru/dashboard')
        return
      }
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setResetMessage('')

    if (role === 'admin') {
      setError('Fitur lupa password hanya untuk siswa dan guru.')
      return
    }
    if (!username.trim()) {
      setError(`Isi ${role === 'guru' ? 'NIP' : 'NISN'} terlebih dahulu untuk mengirim permintaan reset password.`)
      return
    }

    try {
      setResetLoading(true)
      const response = await requestPasswordReset({ username: username.trim(), role })
      setResetMessage(response.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim permintaan reset password')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-branding">
        <div className="login-branding-content">
          <img src={profile.logoUrl} alt={profile.namaAplikasi} />
          <h2>{profile.namaAplikasi}</h2>
          <p className="mb-4">{profile.slogan}</p>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <span className="badge bg-primary bg-opacity-25">Akreditasi {profile.akreditasi}</span>
            <span className="badge bg-primary bg-opacity-25">NSS: {profile.nss}</span>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="text-center mb-4 d-lg-none">
            <img src={profile.logoUrl} alt="Logo" style={{ width: 80 }} />
          </div>
          <div className="mb-3">
            <Link to="/" className="text-decoration-none text-muted small">
              <i className="bi bi-arrow-left me-1"></i>
              Kembali ke Beranda
            </Link>
          </div>
          <h1>Login SIAKAD</h1>

          {error && (
            <div className="alert alert-danger alert-sm" style={{ fontSize: '0.875rem' }}>
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
            </div>
          )}
          {resetMessage && (
            <div className="alert alert-success alert-sm" style={{ fontSize: '0.875rem' }}>
              <i className="bi bi-check-circle me-2"></i>
              {resetMessage}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label fw-medium">Login Sebagai</label>
              <div className="row g-2">
                {[
                  { id: 'siswa', label: 'Siswa', icon: 'bi-person' },
                  { id: 'guru', label: 'Guru', icon: 'bi-person-badge' },
                  { id: 'admin', label: 'Admin', icon: 'bi-shield-lock' },
                ].map(r => (
                  <div className="col-4" key={r.id}>
                    <div
                      className={`card text-center p-2 cursor-pointer ${role === r.id ? 'border-primary bg-primary bg-opacity-10' : 'border'}`}
                      onClick={() => setRole(r.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={`bi ${r.icon} fs-4 ${role === r.id ? 'text-primary' : 'text-muted'}`}></i>
                      <small className={`${role === r.id ? 'fw-medium text-primary' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>{r.label}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">
                {role === 'siswa' ? 'NISN' : role === 'guru' ? 'NIP' : 'Username'}
              </label>
              <input
                type="text"
                className="form-control form-control-siakad"
                placeholder={role === 'siswa' ? 'Masukkan NISN' : role === 'guru' ? 'Masukkan NIP' : 'Masukkan username'}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium">Password</label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-control-siakad pe-5"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted p-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button disabled={loading} type="submit" className="btn btn-primary-siakad mb-3">
              <i className="bi bi-box-arrow-in-right me-2"></i>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-link text-primary p-0"
                style={{ fontSize: '0.875rem' }}
                onClick={handleForgotPassword}
                disabled={resetLoading}
              >
                {resetLoading ? 'Mengirim permintaan...' : 'Request pergantian password ke Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
