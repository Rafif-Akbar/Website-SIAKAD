ALTER TABLE jadwal
  ADD COLUMN tahun_ajaran VARCHAR(20) NOT NULL DEFAULT '2025/2026' AFTER kelas,
  ADD COLUMN semester VARCHAR(20) NOT NULL DEFAULT 'Genap' AFTER tahun_ajaran,
  ADD COLUMN mapel_kode VARCHAR(30) NULL AFTER semester;

ALTER TABLE jadwal
  DROP INDEX jadwal_kelas_slot_unique,
  ADD UNIQUE KEY jadwal_kelas_slot_unique (kelas, tahun_ajaran, semester, hari, jam_ke);
