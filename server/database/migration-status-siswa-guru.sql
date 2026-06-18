ALTER TABLE siswa
  MODIFY status ENUM('Aktif','Lulus','pindah','Drop Out','Nonaktif','Meninggal Dunia') NOT NULL DEFAULT 'Aktif';

ALTER TABLE guru
  MODIFY status ENUM('Aktif','Cuti','Mutasi','Pensiun','Meninggal dunia','Nonaktif') NOT NULL DEFAULT 'Aktif';
