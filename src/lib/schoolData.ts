import { readStored, store } from './frontendActions'

export interface GuruData {
  nip: string
  nama: string
  mapel: string
  jk: string
  status: string
  password?: string
}

export interface SiswaLocalData {
  nisn: string
  nama: string
  kelas: string
  jk: string
  status: string
  password?: string
}

export interface MapelData {
  kode: string
  nama: string
  kelompok: string
  kelas: string
  jpm: number
  guru?: string
}

export interface KelasData {
  nama: string
  wali: string
  jmlSiswa: number
  kapasitas: number
  ruang: string
}

export interface PengumumanData {
  id: string
  judul: string
  kategori: string
  target: string
  tanggal: string
  status: string
  isi: string
}

export interface NilaiData {
  nisn: string
  nama: string
  kelas: string
  mapel: string
  jenis: 'Pengetahuan' | 'Keterampilan'
  nh: number
  tugas: number
  pts: number
  pas: number
}

export interface MateriTugasData {
  id: string
  judul: string
  tipe: 'materi' | 'tugas'
  mapel: string
  kelas: string
  guru: string
  tanggal: string
  deskripsi: string
  file?: string
  deadline?: string
}

export interface KomunikasiMessage {
  id: string
  threadId: string
  fromId: string
  fromName: string
  toId: string
  toName: string
  content: string
  createdAt: string
  readBy: string[]
}

export const defaultGuru: GuruData[] = [
  { nip: '196805152000121002', nama: 'Drs. Hadi Wijaya, M.Pd.', mapel: 'Matematika', jk: 'Laki-laki', status: 'Aktif', password: 'hadi02' },
  { nip: '197203201998032005', nama: 'Dra. Siti Aminah, M.Pd.', mapel: 'Bahasa Indonesia', jk: 'Perempuan', status: 'Aktif', password: 'siti05' },
  { nip: '198001102005012003', nama: 'Dra. Rina Marlina, M.Pd.', mapel: 'Biologi', jk: 'Perempuan', status: 'Aktif', password: 'rina03' },
]

export const defaultSiswa: SiswaLocalData[] = [
  { nisn: '0028374615', nama: 'Ahmad Rizky Pratama', kelas: 'X IPA 1', jk: 'Laki-laki', status: 'Aktif', password: 'rizky15' },
  { nisn: '0028374616', nama: 'Siti Nurhaliza', kelas: 'X IPA 1', jk: 'Perempuan', status: 'Aktif', password: 'siti16' },
  { nisn: '0028374617', nama: 'Budi Santoso', kelas: 'X IPA 2', jk: 'Laki-laki', status: 'Aktif', password: 'budi17' },
]

export const defaultMapel: MapelData[] = [
  { kode: 'MTK', nama: 'Matematika', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4, guru: 'Drs. Hadi Wijaya, M.Pd.' },
  { kode: 'BIND', nama: 'Bahasa Indonesia', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4, guru: 'Dra. Siti Aminah, M.Pd.' },
  { kode: 'BING', nama: 'Bahasa Inggris', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4, guru: 'Dra. Maya Sari, M.Pd.' },
  { kode: 'FIS', nama: 'Fisika', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4, guru: 'Drs. Agus Pratama, M.Pd.' },
  { kode: 'KIM', nama: 'Kimia', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4, guru: 'S.Pd. Budi Hartono' },
  { kode: 'BIO', nama: 'Biologi', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4, guru: 'Dra. Rina Marlina, M.Pd.' },
  { kode: 'SEJ', nama: 'Sejarah', kelompok: 'A', kelas: 'X, XI, XII', jpm: 3, guru: 'S.Pd. Andi Wijaya' },
  { kode: 'PAI', nama: 'Pendidikan Agama Islam', kelompok: 'A', kelas: 'X, XI, XII', jpm: 2, guru: 'Drs. Slamet Riyadi, M.Pd.' },
]

export const defaultKelas: KelasData[] = [
  { nama: 'X IPA 1', wali: 'Drs. Hadi Wijaya, M.Pd.', jmlSiswa: 32, kapasitas: 32, ruang: 'R-101' },
  { nama: 'X IPA 2', wali: 'Dra. Siti Aminah, M.Pd.', jmlSiswa: 30, kapasitas: 32, ruang: 'R-102' },
  { nama: 'X IPS 1', wali: 'Dra. Rina Marlina, M.Pd.', jmlSiswa: 31, kapasitas: 32, ruang: 'R-103' },
  { nama: 'XI IPA 1', wali: 'S.Pd. Budi Hartono', jmlSiswa: 32, kapasitas: 32, ruang: 'R-201' },
  { nama: 'XII IPA 1', wali: 'S.Pd. Dedi Kurniawan', jmlSiswa: 32, kapasitas: 32, ruang: 'R-301' },
]

export const defaultPengumuman: PengumumanData[] = [
  { id: '1', judul: 'Pengumuman Awal Semester Genap 2025/2026', kategori: 'Akademik', target: 'Semua', tanggal: '15 Jan 2026', status: 'Dipublikasikan', isi: 'Kegiatan belajar mengajar semester genap dimulai sesuai kalender akademik.' },
  { id: '2', judul: 'Jadwal Ujian Tengah Semester (PTS)', kategori: 'Akademik', target: 'Siswa', tanggal: '12 Jan 2026', status: 'Dipublikasikan', isi: 'Jadwal PTS dapat dilihat melalui wali kelas masing-masing.' },
]

export const defaultJadwal: Record<string, string> = {
  'X IPA 1-Senin-1': 'Matematika',
  'X IPA 1-Senin-2': 'Matematika',
  'X IPA 1-Senin-3': 'Bahasa Indonesia',
  'X IPA 1-Selasa-1': 'Fisika',
  'X IPA 1-Rabu-1': 'Kimia',
}

export function getStoredGuru() {
  return readStored<GuruData[]>('siakad_guru', defaultGuru)
}

export function getStoredSiswa() {
  return readStored<SiswaLocalData[]>('siakad_siswa', defaultSiswa)
}

export function saveStoredSiswa(data: SiswaLocalData[]) {
  store('siakad_siswa', data)
}

export function getStoredMapel() {
  return readStored<MapelData[]>('siakad_mapel', defaultMapel)
}

export function getStoredKelas() {
  return readStored<KelasData[]>('siakad_kelas', defaultKelas)
}

export function getStoredPengumuman() {
  return readStored<PengumumanData[]>('siakad_pengumuman', defaultPengumuman)
}

export function getStoredNilai() {
  return readStored<NilaiData[]>('siakad_nilai', [])
}

export function getStoredMateriTugas() {
  return readStored<MateriTugasData[]>('siakad_materi_tugas', [])
}

export function getStoredMessages() {
  return readStored<KomunikasiMessage[]>('siakad_komunikasi', [])
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('siakad_user') || '{}') as { username?: string; name?: string; role?: string }
  } catch {
    return {}
  }
}

export function calculateNa(nh: number, pts: number, pas: number, tugas = 0) {
  if (!nh || !pts || !pas) return 0
  if (tugas) return Math.round((nh * 0.3) + (tugas * 0.2) + (pts * 0.25) + (pas * 0.25))
  return Math.round((nh * 0.4) + (pts * 0.3) + (pas * 0.3))
}

export function gradeLabel(na: number) {
  if (na >= 90) return 'A'
  if (na >= 85) return 'A-'
  if (na >= 80) return 'B+'
  if (na >= 75) return 'B'
  return 'C'
}
