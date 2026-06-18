import dotenv from 'dotenv'
import { pool, query } from '../src/db.js'

dotenv.config()

await query(
  `INSERT INTO users (username, password_hash, role, name)
   SELECT nip, password_hash, 'guru', nama
   FROM guru
   ON DUPLICATE KEY UPDATE
     password_hash = VALUES(password_hash),
     role = VALUES(role),
     name = VALUES(name)`,
)

await query(
  `INSERT INTO users (username, password_hash, role, name)
   SELECT nisn, password_hash, 'siswa', nama
   FROM siswa
   ON DUPLICATE KEY UPDATE
     password_hash = VALUES(password_hash),
     role = VALUES(role),
     name = VALUES(name)`,
)

console.log('Akun login guru dan siswa berhasil disinkronkan ke tabel users.')

await pool.end()
