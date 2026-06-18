import { getSettings } from './api'

export interface SchoolProfile {
  namaAplikasi: string
  namaSekolah: string
  kota: string
  slogan: string
  nss: string
  npsn: string
  akreditasi: string
  alamat: string
  telepon: string
  email: string
  logoUrl: string
  kepsekFoto: string
}

export const defaultSchoolProfile: SchoolProfile = {
  namaAplikasi: 'SMA Negeri 3 Surabaya',
  namaSekolah: 'SMA Negeri 3 Surabaya',
  kota: 'Surabaya',
  slogan: 'Raih Prestasi, Penuh Motivasi',
  nss: '301056013003',
  npsn: '20533158',
  akreditasi: 'A (Nilai 93)',
  alamat: 'Jl. Memet Sastrowiryo No.54, Komp. Kenjeran, Kec. Bulak, Surabaya, Jawa Timur 60121',
  telepon: '(031) 5678901',
  email: 'info@sman3surabaya.sch.id',
  logoUrl: '/assets/logo-sman3.png',
  kepsekFoto: '/assets/kepsek.jpg',
}

export async function loadSchoolProfile() {
  const data = await getSettings()
  const sekolah = data.settings.sekolah || {}
  const umum = data.settings.umum || {}
  const profile = { ...defaultSchoolProfile, ...sekolah } as SchoolProfile
  const namaAplikasi = typeof umum.namaAplikasi === 'string' && umum.namaAplikasi.trim()
    ? umum.namaAplikasi.trim()
    : profile.namaAplikasi || profile.namaSekolah
  return { ...profile, namaAplikasi } as SchoolProfile
}
