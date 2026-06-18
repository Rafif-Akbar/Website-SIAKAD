import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/public/Home'
import Profil from './pages/public/Profil'
import Berita from './pages/public/Berita'
import Ekstrakurikuler from './pages/public/Ekstrakurikuler'
import TataTertib from './pages/public/TataTertib'
import Prestasi from './pages/public/Prestasi'
import Kalender from './pages/public/Kalender'
import Kontak from './pages/public/Kontak'
import Bantuan from './pages/public/Bantuan'
import Login from './pages/public/Login'

import AdminDashboard from './pages/dashboards/admin/Dashboard'
import AdminSiswa from './pages/dashboards/admin/Siswa'
import AdminGuru from './pages/dashboards/admin/Guru'
import AdminKelas from './pages/dashboards/admin/Kelas'
import AdminMapel from './pages/dashboards/admin/Mapel'
import AdminJadwal from './pages/dashboards/admin/Jadwal'
import AdminTahunAjaran from './pages/dashboards/admin/TahunAjaran'
import AdminPrestasi from './pages/dashboards/admin/Prestasi'
import AdminEkstrakurikuler from './pages/dashboards/admin/Ekstrakurikuler'
import AdminArsip from './pages/dashboards/admin/Arsip'
import AdminPengumuman from './pages/dashboards/admin/Pengumuman'
import AdminLaporan from './pages/dashboards/admin/Laporan'
import AdminPengaturan from './pages/dashboards/admin/Pengaturan'

import GuruDashboard from './pages/dashboards/guru/Dashboard'
import GuruMateri from './pages/dashboards/guru/Materi'
import GuruJadwal from './pages/dashboards/guru/Jadwal'
import GuruNilai from './pages/dashboards/guru/Nilai'
import GuruAbsensi from './pages/dashboards/guru/Absensi'
import GuruAkun from './pages/dashboards/guru/Akun'

import SiswaDashboard from './pages/dashboards/siswa/Dashboard'
import SiswaJadwal from './pages/dashboards/siswa/Jadwal'
import SiswaNilai from './pages/dashboards/siswa/Nilai'
import SiswaAbsensi from './pages/dashboards/siswa/Absensi'
import SiswaMateri from './pages/dashboards/siswa/Materi'
import SiswaPengumuman from './pages/dashboards/siswa/Pengumuman'
import SiswaAkun from './pages/dashboards/siswa/Akun'

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) {
  const userStr = localStorage.getItem('siakad_user')
  if (!userStr) return <Navigate to="/login" replace />
  
  try {
    const user = JSON.parse(userStr)
    if (user.role !== allowedRole) return <Navigate to="/login" replace />
    return <>{children}</>
  } catch {
    return <Navigate to="/login" replace />
  }
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/profil" element={<Profil />} />
      <Route path="/berita" element={<Berita />} />
      <Route path="/ekstrakurikuler" element={<Ekstrakurikuler />} />
      <Route path="/tata-tertib" element={<TataTertib />} />
      <Route path="/prestasi" element={<Prestasi />} />
      <Route path="/kalender" element={<Kalender />} />
      <Route path="/kontak" element={<Kontak />} />
      <Route path="/bantuan" element={<Bantuan />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/siswa" element={<ProtectedRoute allowedRole="admin"><AdminSiswa /></ProtectedRoute>} />
      <Route path="/admin/guru" element={<ProtectedRoute allowedRole="admin"><AdminGuru /></ProtectedRoute>} />
      <Route path="/admin/kelas" element={<ProtectedRoute allowedRole="admin"><AdminKelas /></ProtectedRoute>} />
      <Route path="/admin/mapel" element={<ProtectedRoute allowedRole="admin"><AdminMapel /></ProtectedRoute>} />
      <Route path="/admin/jadwal" element={<ProtectedRoute allowedRole="admin"><AdminJadwal /></ProtectedRoute>} />
      <Route path="/admin/tahun-ajaran" element={<ProtectedRoute allowedRole="admin"><AdminTahunAjaran /></ProtectedRoute>} />
      <Route path="/admin/prestasi" element={<ProtectedRoute allowedRole="admin"><AdminPrestasi /></ProtectedRoute>} />
      <Route path="/admin/ekstrakurikuler" element={<ProtectedRoute allowedRole="admin"><AdminEkstrakurikuler /></ProtectedRoute>} />
      <Route path="/admin/arsip" element={<ProtectedRoute allowedRole="admin"><AdminArsip /></ProtectedRoute>} />
      <Route path="/admin/pengumuman" element={<ProtectedRoute allowedRole="admin"><AdminPengumuman /></ProtectedRoute>} />
      <Route path="/admin/laporan" element={<ProtectedRoute allowedRole="admin"><AdminLaporan /></ProtectedRoute>} />
      <Route path="/admin/pengaturan" element={<ProtectedRoute allowedRole="admin"><AdminPengaturan /></ProtectedRoute>} />

      {/* Guru Routes */}
      <Route path="/guru/dashboard" element={<ProtectedRoute allowedRole="guru"><GuruDashboard /></ProtectedRoute>} />
      <Route path="/guru/materi" element={<ProtectedRoute allowedRole="guru"><GuruMateri /></ProtectedRoute>} />
      <Route path="/guru/jadwal" element={<ProtectedRoute allowedRole="guru"><GuruJadwal /></ProtectedRoute>} />
      <Route path="/guru/nilai" element={<ProtectedRoute allowedRole="guru"><GuruNilai /></ProtectedRoute>} />
      <Route path="/guru/absensi" element={<ProtectedRoute allowedRole="guru"><GuruAbsensi /></ProtectedRoute>} />
      <Route path="/guru/akun" element={<ProtectedRoute allowedRole="guru"><GuruAkun /></ProtectedRoute>} />

      {/* Siswa Routes */}
      <Route path="/siswa/dashboard" element={<ProtectedRoute allowedRole="siswa"><SiswaDashboard /></ProtectedRoute>} />
      <Route path="/siswa/jadwal" element={<ProtectedRoute allowedRole="siswa"><SiswaJadwal /></ProtectedRoute>} />
      <Route path="/siswa/nilai" element={<ProtectedRoute allowedRole="siswa"><SiswaNilai /></ProtectedRoute>} />
      <Route path="/siswa/absensi" element={<ProtectedRoute allowedRole="siswa"><SiswaAbsensi /></ProtectedRoute>} />
      <Route path="/siswa/materi" element={<ProtectedRoute allowedRole="siswa"><SiswaMateri /></ProtectedRoute>} />
      <Route path="/siswa/pengumuman" element={<ProtectedRoute allowedRole="siswa"><SiswaPengumuman /></ProtectedRoute>} />
      <Route path="/siswa/akun" element={<ProtectedRoute allowedRole="siswa"><SiswaAkun /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
