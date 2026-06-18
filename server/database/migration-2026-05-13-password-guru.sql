USE siakad_smaga;

ALTER TABLE siswa
  ADD COLUMN IF NOT EXISTS password_hash CHAR(64) NULL AFTER status;

UPDATE siswa
SET password_hash = SHA2('siswa123', 256)
WHERE password_hash IS NULL;

ALTER TABLE siswa
  MODIFY password_hash CHAR(64) NOT NULL;

CREATE TABLE IF NOT EXISTS guru (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nip VARCHAR(30) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  mapel VARCHAR(100) NOT NULL,
  jk ENUM('Laki-laki', 'Perempuan') NOT NULL,
  status ENUM('Aktif', 'Cuti', 'Pensiun') NOT NULL DEFAULT 'Aktif',
  password_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
