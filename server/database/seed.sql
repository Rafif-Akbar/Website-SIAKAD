USE siakad_smaga;

ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS jam_ke INT NOT NULL DEFAULT 1 AFTER hari;
ALTER TABLE absensi ADD COLUMN IF NOT EXISTS tanggal DATE NULL AFTER nisn;

DELETE FROM users
WHERE username NOT IN (
  'admin',
  '196805152000121002',
  '197203201998032005',
  '198001102005012003',
  '0028374615',
  '0028374616',
  '0028374617'
);

DELETE FROM guru
WHERE nip NOT IN (
  '196805152000121002',
  '197203201998032005',
  '198001102005012003'
);

DELETE FROM siswa
WHERE nisn NOT IN (
  '0028374615',
  '0028374616',
  '0028374617'
);

DELETE FROM jadwal;
ALTER TABLE jadwal ADD UNIQUE KEY IF NOT EXISTS jadwal_kelas_slot_unique (kelas, hari, jam_ke);
DELETE FROM nilai;
DELETE FROM absensi;
DELETE FROM pengumuman;
DELETE FROM materi_tugas;

INSERT INTO users (username, password_hash, role, name) VALUES
  ('admin', SHA2('admin123', 256), 'admin', 'Administrator')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  name = VALUES(name);

INSERT INTO guru (nip, nama, mapel, jk, status, password_hash) VALUES
  ('196805152000121002', 'Drs. Hadi Wijaya, M.Pd.', 'Matematika', 'Laki-laki', 'Aktif', SHA2('hadi02', 256)),
  ('197203201998032005', 'Dra. Siti Aminah, M.Pd.', 'Bahasa Indonesia', 'Perempuan', 'Aktif', SHA2('siti05', 256)),
  ('198001102005012003', 'Dra. Rina Marlina, M.Pd.', 'Biologi', 'Perempuan', 'Aktif', SHA2('rina03', 256))
ON DUPLICATE KEY UPDATE
  nama = VALUES(nama),
  mapel = VALUES(mapel),
  jk = VALUES(jk),
  status = VALUES(status),
  password_hash = VALUES(password_hash);

INSERT INTO siswa (nisn, nama, kelas, jk, status, password_hash) VALUES
  ('0028374615', 'Ahmad Rizky Pratama', 'X IPA 1', 'Laki-laki', 'Aktif', SHA2('rizky15', 256)),
  ('0028374616', 'Siti Nurhaliza', 'X IPA 1', 'Perempuan', 'Aktif', SHA2('siti16', 256)),
  ('0028374617', 'Budi Santoso', 'X IPA 2', 'Laki-laki', 'Aktif', SHA2('budi17', 256))
ON DUPLICATE KEY UPDATE
  nama = VALUES(nama),
  kelas = VALUES(kelas),
  jk = VALUES(jk),
  status = VALUES(status),
  password_hash = VALUES(password_hash);

INSERT INTO users (username, password_hash, role, name)
SELECT nip, password_hash, 'guru', nama
FROM guru
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  name = VALUES(name);

INSERT INTO users (username, password_hash, role, name)
SELECT nisn, password_hash, 'siswa', nama
FROM siswa
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  name = VALUES(name);

INSERT INTO jadwal (hari, jam_ke, jam, kelas, mapel, guru_nip, ruang, status) VALUES
  ('Senin', 1, '07:00 - 07:45', 'X IPA 1', 'Matematika', '196805152000121002', 'R-101', 'Selesai'),
  ('Senin', 2, '07:45 - 08:30', 'X IPA 1', 'Matematika', '196805152000121002', 'R-101', 'Selesai'),
  ('Senin', 3, '08:30 - 09:15', 'X IPA 1', 'Bahasa Indonesia', '197203201998032005', 'R-101', 'Sedang Berlangsung'),
  ('Senin', 4, '09:30 - 10:15', 'X IPA 1', 'Biologi', '198001102005012003', 'R-101', 'Mendatang'),
  ('Senin', 1, '07:00 - 07:45', 'X IPA 2', 'Bahasa Indonesia', '197203201998032005', 'R-102', 'Selesai'),
  ('Senin', 2, '07:45 - 08:30', 'X IPA 2', 'Biologi', '198001102005012003', 'R-102', 'Selesai'),
  ('Senin', 3, '08:30 - 09:15', 'X IPA 2', 'Matematika', '196805152000121002', 'R-102', 'Sedang Berlangsung');

INSERT INTO nilai (nisn, mapel, nh, tugas, pts, pas, na) VALUES
  ('0028374615', 'Matematika', 85, 86, 88, 89, 87),
  ('0028374615', 'Bahasa Indonesia', 90, 89, 87, 90, 89),
  ('0028374615', 'Biologi', 78, 80, 82, 81, 80),
  ('0028374616', 'Matematika', 88, 87, 86, 88, 87),
  ('0028374616', 'Bahasa Indonesia', 91, 90, 90, 92, 91),
  ('0028374616', 'Biologi', 84, 85, 85, 86, 85),
  ('0028374617', 'Matematika', 82, 81, 80, 82, 81),
  ('0028374617', 'Bahasa Indonesia', 85, 84, 83, 85, 84),
  ('0028374617', 'Biologi', 86, 87, 88, 87, 87)
ON DUPLICATE KEY UPDATE
  nh = VALUES(nh),
  tugas = VALUES(tugas),
  pts = VALUES(pts),
  pas = VALUES(pas),
  na = VALUES(na);

INSERT INTO absensi (nisn, tanggal, bulan, hadir, sakit, izin, alpa) VALUES
  ('0028374615', CURDATE(), ELT(MONTH(CURDATE()), 'Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'), 1, 0, 0, 0),
  ('0028374616', CURDATE(), ELT(MONTH(CURDATE()), 'Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'), 1, 0, 0, 0),
  ('0028374617', CURDATE(), ELT(MONTH(CURDATE()), 'Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'), 1, 0, 0, 0)
ON DUPLICATE KEY UPDATE
  tanggal = VALUES(tanggal),
  bulan = VALUES(bulan),
  hadir = VALUES(hadir),
  sakit = VALUES(sakit),
  izin = VALUES(izin),
  alpa = VALUES(alpa);

INSERT INTO pengumuman (id, judul, kategori, target, tanggal, penting, status, isi) VALUES
  ('1', 'Jadwal PTS dimulai 3 Maret 2026', 'Akademik', 'Siswa', '12 Jan 2026', 1, 'Dipublikasikan', 'Jadwal PTS dapat dilihat melalui wali kelas masing-masing.'),
  ('2', 'Pendaftaran ekstrakurikuler dibuka', 'Kesiswaan', 'Semua', '08 Jan 2026', 0, 'Dipublikasikan', 'Pendaftaran ekstrakurikuler semester genap telah dibuka.'),
  ('3', 'Pengumpulan tugas akademik', 'Akademik', 'Siswa', '07 Jan 2026', 0, 'Dipublikasikan', 'Siswa diminta mengumpulkan tugas sesuai jadwal guru mata pelajaran.')
ON DUPLICATE KEY UPDATE
  judul = VALUES(judul),
  kategori = VALUES(kategori),
  target = VALUES(target),
  tanggal = VALUES(tanggal),
  penting = VALUES(penting),
  status = VALUES(status),
  isi = VALUES(isi);

INSERT INTO settings (setting_key, setting_value) VALUES
  ('umum', JSON_OBJECT(
    'namaAplikasi', 'SIAKAD SMAN 3 Surabaya',
    'zonaWaktu', 'Asia/Jakarta (WIB)',
    'formatTanggal', 'DD/MM/YYYY',
    'modePemeliharaan', false
  )),
  ('sekolah', JSON_OBJECT(
    'namaSekolah', 'SMA Negeri 3 Surabaya',
    'nss', '301056013003',
    'npsn', '20533158',
    'akreditasi', 'A (Nilai 93)',
    'alamat', 'Jl. Memet Sastrowiryo No.54, Komp. Kenjeran, Kec. Bulak, Surabaya, Jawa Timur 60121',
    'telepon', '(031) 5678901',
    'email', 'seccondgilang@gmail.com'
  ))
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value);
