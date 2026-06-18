import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'node:fs/promises'
import nodemailer from 'nodemailer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { query } from './db.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 3001)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseDir = path.resolve(__dirname, '..', 'database')
const loginAttempts = new Map()

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
}))
app.use(express.json({ limit: '25mb' }))
app.disable('x-powered-by')
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})

app.get('/api/health', async (_req, res, next) => {
  try {
    await query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (error) {
    next(error)
  }
})

async function upsertLoginUser(username, password, role, name) {
  await query(
    `INSERT INTO users (username, password_hash, role, name)
     VALUES (?, SHA2(?, 256), ?, ?)
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       role = VALUES(role),
       name = VALUES(name)`,
    [username, password, role, name],
  )
}

async function renameLoginUser(oldUsername, newUsername, role, name) {
  await query(
    `UPDATE users
     SET username = ?, name = ?
     WHERE username = ? AND role = ?`,
    [newUsername, name, oldUsername, role],
  )
}

async function deleteLoginUser(username, role) {
  await query('DELETE FROM users WHERE username = ? AND role = ?', [username, role])
}

async function updateAccountPassword(username, role, password) {
  await query('UPDATE users SET password_hash = SHA2(?, 256) WHERE username = ? AND role = ?', [password, username, role])
  if (role === 'siswa') {
    await query('UPDATE siswa SET password_hash = SHA2(?, 256) WHERE nisn = ?', [password, username])
  }
  if (role === 'guru') {
    await query('UPDATE guru SET password_hash = SHA2(?, 256) WHERE nip = ?', [password, username])
  }
}

async function ensurePasswordResetTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS password_reset_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      role ENUM('guru', 'siswa') NOT NULL,
      status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      closed_at TIMESTAMP NULL
    )`,
  )
}

async function getOpenPasswordReset(username, role) {
  await ensurePasswordResetTable()
  const requests = await query(
    `SELECT id FROM password_reset_requests
     WHERE username = ? AND role = ? AND status = 'open'
     ORDER BY requested_at DESC
     LIMIT 1`,
    [username, role],
  )
  return requests[0] || null
}

async function closePasswordReset(username, role) {
  await ensurePasswordResetTable()
  await query(
    `UPDATE password_reset_requests
     SET status = 'closed', closed_at = CURRENT_TIMESTAMP
     WHERE username = ? AND role = ? AND status = 'open'`,
    [username, role],
  )
}

async function ensureNilaiScoreColumns() {
  const tugasColumns = await query("SHOW COLUMNS FROM nilai LIKE 'tugas'")
  if (tugasColumns.length === 0) {
    await query('ALTER TABLE nilai ADD COLUMN tugas INT NOT NULL DEFAULT 0 AFTER nh')
  }
  const pasColumns = await query("SHOW COLUMNS FROM nilai LIKE 'pas'")
  if (pasColumns.length === 0) {
    await query('ALTER TABLE nilai ADD COLUMN pas INT NOT NULL DEFAULT 0 AFTER pts')
  }
}

function todayName() {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' })
}

async function ensurePrestasiTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS prestasi (
      id VARCHAR(40) PRIMARY KEY,
      judul VARCHAR(180) NOT NULL,
      kategori VARCHAR(30) NOT NULL,
      deskripsi TEXT NOT NULL,
      gambar LONGTEXT NULL,
      tanggal VARCHAR(30) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  )
}

function tooManyLoginAttempts(key) {
  const now = Date.now()
  const entry = loginAttempts.get(key) || { count: 0, firstAt: now }
  if (now - entry.firstAt > 15 * 60 * 1000) {
    loginAttempts.set(key, { count: 1, firstAt: now })
    return false
  }
  entry.count += 1
  loginAttempts.set(key, entry)
  return entry.count > 8
}

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function createMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

app.post('/api/login', async (req, res, next) => {
  try {
    const { username, password, role } = req.body

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Username, password, dan role wajib diisi' })
    }
    if (!['admin', 'guru', 'siswa'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' })
    }
    const attemptKey = `${req.ip}:${role}:${username}`
    if (tooManyLoginAttempts(attemptKey)) {
      return res.status(429).json({ message: 'Terlalu banyak percobaan login. Coba lagi beberapa menit.' })
    }

    let users = await query(
      `SELECT id, username, role, name
       FROM users
       WHERE username = ? AND role = ? AND password_hash = SHA2(?, 256)
       LIMIT 1`,
      [username, role, password],
    )

    if (users.length === 0 && role === 'siswa') {
      users = await query(
        `SELECT id, nisn AS username, 'siswa' AS role, nama AS name
         FROM siswa
         WHERE nisn = ? AND password_hash = SHA2(?, 256)
         LIMIT 1`,
        [username, password],
      )
    }

    if (users.length === 0 && role === 'guru') {
      users = await query(
        `SELECT id, nip AS username, 'guru' AS role, nama AS name
         FROM guru
         WHERE nip = ? AND password_hash = SHA2(?, 256)
         LIMIT 1`,
        [username, password],
      )
    }

    if (users.length === 0) {
      return res.status(401).json({ message: 'Login gagal. Periksa data login Anda.' })
    }
    if (role === 'siswa') {
      const siswaStatus = await query('SELECT status FROM siswa WHERE nisn = ? LIMIT 1', [username])
      if (siswaStatus.length > 0 && !['Aktif', 'Lulus'].includes(siswaStatus[0].status)) {
        return res.status(403).json({ message: 'Akun Siswa Anda saat ini tidak aktif. Silakan hubungi administrator sekolah untuk informasi lebih lanjut.' })
      }
    }
    if (role === 'guru') {
      const guruStatus = await query('SELECT status FROM guru WHERE nip = ? LIMIT 1', [username])
      if (guruStatus.length > 0 && !['Aktif', 'Cuti'].includes(guruStatus[0].status)) {
        return res.status(403).json({ message: 'Akun Guru Anda saat ini tidak aktif. Silakan hubungi administrator sekolah untuk informasi lebih lanjut.' })
      }
    }
    loginAttempts.delete(attemptKey)

    res.json({ user: users[0] })
  } catch (error) {
    next(error)
  }
})

app.post('/api/password-reset/request', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim()
    const role = String(req.body.role || '').trim()

    if (!username || !['guru', 'siswa'].includes(role)) {
      return res.status(400).json({ message: 'NISN/NIP dan role wajib diisi' })
    }

    const account = role === 'siswa'
      ? await query('SELECT nisn AS username, nama AS name FROM siswa WHERE nisn = ? LIMIT 1', [username])
      : await query('SELECT nip AS username, nama AS name FROM guru WHERE nip = ? LIMIT 1', [username])

    if (account.length === 0) {
      return res.status(404).json({ message: role === 'siswa' ? 'Data siswa tidak ditemukan' : 'Data guru tidak ditemukan' })
    }

    const openRequest = await getOpenPasswordReset(username, role)
    if (openRequest) {
      await query('UPDATE password_reset_requests SET requested_at = CURRENT_TIMESTAMP WHERE id = ?', [openRequest.id])
    } else {
      await query(
        `INSERT INTO password_reset_requests (username, role, status)
         VALUES (?, ?, 'open')`,
        [username, role],
      )
    }

    res.json({ message: 'Request anda sudah terkirim' })
  } catch (error) {
    next(error)
  }
})

app.get('/api/password-reset/requests', async (_req, res, next) => {
  try {
    await ensurePasswordResetTable()
    const requests = await query(
      `SELECT r.id, r.username, r.role, r.requested_at AS requestedAt,
              COALESCE(s.nama, g.nama, r.username) AS name
       FROM password_reset_requests r
       LEFT JOIN siswa s ON r.role = 'siswa' AND s.nisn = r.username
       LEFT JOIN guru g ON r.role = 'guru' AND g.nip = r.username
       WHERE r.status = 'open'
       ORDER BY r.requested_at DESC`,
    )
    res.json(requests)
  } catch (error) {
    next(error)
  }
})

app.post('/api/account/change-password', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim()
    const role = String(req.body.role || '').trim()
    const password = String(req.body.password || '').trim()

    if (!username || !['guru', 'siswa'].includes(role) || !password) {
      return res.status(400).json({ message: 'Username, role, dan password baru wajib diisi' })
    }

    const account = role === 'siswa'
      ? await query('SELECT nisn FROM siswa WHERE nisn = ? LIMIT 1', [username])
      : await query('SELECT nip FROM guru WHERE nip = ? LIMIT 1', [username])

    if (account.length === 0) {
      return res.status(404).json({ message: 'Akun tidak ditemukan' })
    }

    await updateAccountPassword(username, role, password)
    await closePasswordReset(username, role)
    res.json({ message: 'Password berhasil diperbarui' })
  } catch (error) {
    next(error)
  }
})

app.get('/api/siswa', async (_req, res, next) => {
  try {
    const siswa = await query(
      `SELECT nisn, nama, kelas, jk, status
       FROM siswa
       ORDER BY nama ASC`,
    )

    res.json(siswa)
  } catch (error) {
    next(error)
  }
})

app.post('/api/siswa', async (req, res, next) => {
  try {
    const nisn = String(req.body.nisn || '').trim()
    const nama = String(req.body.nama || '').trim()
    const kelas = String(req.body.kelas || '').trim()
    const jk = String(req.body.jk || '').trim()
    const status = String(req.body.status || 'Aktif').trim()
    const password = String(req.body.password || '').trim()

    if (!nisn || !nama || !kelas || !jk) {
      return res.status(400).json({ message: 'NISN, nama, kelas, dan jenis kelamin wajib diisi' })
    }
    if (!password) {
      return res.status(400).json({ message: 'Password awal wajib diisi' })
    }

    await query(
      `INSERT INTO siswa (nisn, nama, kelas, jk, status, password_hash)
       VALUES (?, ?, ?, ?, ?, SHA2(?, 256))`,
      [nisn, nama, kelas, jk, status, password],
    )
    await upsertLoginUser(nisn, password, 'siswa', nama)

    const [saved] = await query('SELECT nisn, nama, kelas, jk, status FROM siswa WHERE nisn = ? LIMIT 1', [nisn])
    res.status(201).json(saved)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'NISN sudah digunakan' })
    }
    next(error)
  }
})

app.put('/api/siswa/:nisn', async (req, res, next) => {
  try {
    const { nisn: oldNisn } = req.params
    const nisn = String(req.body.nisn || '').trim()
    const nama = String(req.body.nama || '').trim()
    const kelas = String(req.body.kelas || '').trim()
    const jk = String(req.body.jk || '').trim()
    const status = String(req.body.status || '').trim()
    const password = req.body.password ? String(req.body.password).trim() : ''

    if (!nisn || !nama || !kelas || !jk || !status) {
      return res.status(400).json({ message: 'NISN, nama, kelas, jenis kelamin, dan status wajib diisi' })
    }
    if (password && !(await getOpenPasswordReset(oldNisn, 'siswa'))) {
      return res.status(403).json({ message: 'Akses ubah password siswa terkunci. Minta siswa menekan Lupa Password terlebih dahulu.' })
    }

    const result = await query(
      `UPDATE siswa
       SET nisn = ?, nama = ?, kelas = ?, jk = ?, status = ?${password ? ', password_hash = SHA2(?, 256)' : ''}
       WHERE nisn = ?`,
      password ? [nisn, nama, kelas, jk, status, password, oldNisn] : [nisn, nama, kelas, jk, status, oldNisn],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data siswa tidak ditemukan' })
    }
    await renameLoginUser(oldNisn, nisn, 'siswa', nama)
    if (password) {
      await upsertLoginUser(nisn, password, 'siswa', nama)
      await closePasswordReset(oldNisn, 'siswa')
      if (oldNisn !== nisn) {
        await closePasswordReset(nisn, 'siswa')
      }
    }

    const [saved] = await query('SELECT nisn, nama, kelas, jk, status FROM siswa WHERE nisn = ? LIMIT 1', [nisn])
    res.json(saved)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'NISN sudah digunakan' })
    }
    next(error)
  }
})

app.delete('/api/siswa/:nisn', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM siswa WHERE nisn = ?', [req.params.nisn])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data siswa tidak ditemukan' })
    }
    await deleteLoginUser(req.params.nisn, 'siswa')

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/guru', async (_req, res, next) => {
  try {
    const guru = await query(
      `SELECT nip, nama, mapel, jk, status
       FROM guru
       ORDER BY nama ASC`,
    )

    res.json(guru)
  } catch (error) {
    next(error)
  }
})

app.post('/api/guru', async (req, res, next) => {
  try {
    const { nip, nama, mapel, jk, status = 'Aktif' } = req.body
    const password = String(req.body.password || '').trim()

    if (!nip || !nama || !mapel || !jk) {
      return res.status(400).json({ message: 'NIP, nama, mapel, dan jenis kelamin wajib diisi' })
    }
    if (!password) {
      return res.status(400).json({ message: 'Password awal wajib diisi' })
    }

    await query(
      `INSERT INTO guru (nip, nama, mapel, jk, status, password_hash)
       VALUES (?, ?, ?, ?, ?, SHA2(?, 256))`,
      [nip, nama, mapel, jk, status, password],
    )
    await upsertLoginUser(nip, password, 'guru', nama)

    res.status(201).json({ nip, nama, mapel, jk, status })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'NIP sudah digunakan' })
    }
    next(error)
  }
})

app.put('/api/guru/:nip', async (req, res, next) => {
  try {
    const { nip: oldNip } = req.params
    const { nip, nama, mapel, jk, status, password } = req.body

    if (!nip || !nama || !mapel || !jk || !status) {
      return res.status(400).json({ message: 'NIP, nama, mapel, jenis kelamin, dan status wajib diisi' })
    }
    const nextPassword = password ? String(password).trim() : ''
    if (nextPassword && !(await getOpenPasswordReset(oldNip, 'guru'))) {
      return res.status(403).json({ message: 'Akses ubah password guru terkunci. Minta guru menekan Lupa Password terlebih dahulu.' })
    }

    const result = await query(
      `UPDATE guru
       SET nip = ?, nama = ?, mapel = ?, jk = ?, status = ?${nextPassword ? ', password_hash = SHA2(?, 256)' : ''}
       WHERE nip = ?`,
      nextPassword ? [nip, nama, mapel, jk, status, nextPassword, oldNip] : [nip, nama, mapel, jk, status, oldNip],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data guru tidak ditemukan' })
    }
    await renameLoginUser(oldNip, nip, 'guru', nama)
    if (nextPassword) {
      await upsertLoginUser(nip, nextPassword, 'guru', nama)
      await closePasswordReset(oldNip, 'guru')
      if (oldNip !== nip) {
        await closePasswordReset(nip, 'guru')
      }
    }

    res.json({ nip, nama, mapel, jk, status })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'NIP sudah digunakan' })
    }
    next(error)
  }
})

app.delete('/api/guru/:nip', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM guru WHERE nip = ?', [req.params.nip])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data guru tidak ditemukan' })
    }
    await deleteLoginUser(req.params.nip, 'guru')

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

async function getJsonSetting(key, fallback) {
  const [setting] = await query('SELECT setting_value AS value FROM settings WHERE setting_key = ? LIMIT 1', [key])
  if (!setting) return fallback
  if (typeof setting.value !== 'string') return setting.value || fallback
  try {
    return JSON.parse(setting.value)
  } catch {
    return fallback
  }
}

async function setJsonSetting(key, value) {
  await query(
    `INSERT INTO settings (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, JSON.stringify(value)],
  )
}

function mapelCode(name) {
  return String(name || '')
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 8) || 'MAPEL'
}

app.get('/api/mapel', async (_req, res, next) => {
  try {
    const savedMapel = await getJsonSetting('mapel', [])
    const deletedMapel = await getJsonSetting('deleted_mapel', [])
    const deletedCodes = new Set(deletedMapel.map(item => item.kode).filter(Boolean))
    const deletedNames = new Set(deletedMapel.map(item => item.nama).filter(Boolean))
    const guru = await query(
      `SELECT nip, nama, mapel
       FROM guru
       WHERE status <> 'Pensiun'
       ORDER BY nama ASC`,
    )
    const jadwalMapel = await query('SELECT DISTINCT mapel FROM jadwal WHERE mapel <> "" ORDER BY mapel ASC')
    const nilaiMapel = await query('SELECT DISTINCT mapel FROM nilai WHERE mapel <> "" ORDER BY mapel ASC')
    const byCode = new Map(savedMapel
      .filter(item => !deletedCodes.has(item.kode))
      .map(item => [item.kode, item]))

    for (const item of [...guru, ...jadwalMapel, ...nilaiMapel]) {
      const namaMapel = item.mapel
      const kodeMapel = mapelCode(namaMapel)
      if (!namaMapel || deletedNames.has(namaMapel) || deletedCodes.has(kodeMapel)) continue
      if (!byCode.has(kodeMapel) && !Array.from(byCode.values()).some(row => row.nama === namaMapel)) {
        byCode.set(kodeMapel, {
          kode: kodeMapel,
          nama: namaMapel,
          kelompok: 'A',
          kelas: 'X, XI, XII',
          jpm: 2,
        })
      }
    }

    const mapel = Array.from(byCode.values()).map(item => {
      const teachers = guru.filter(g => g.mapel === item.nama)
      return {
        ...item,
        guru: teachers.map(g => g.nama).join(', '),
        guruNip: teachers[0]?.nip || '',
      }
    }).sort((a, b) => a.nama.localeCompare(b.nama, 'id') || a.kode.localeCompare(b.kode, 'id'))

    res.json(mapel)
  } catch (error) {
    next(error)
  }
})

app.post('/api/mapel', async (req, res, next) => {
  try {
    const { kode, nama, kelompok, kelas, jpm, guruNip } = req.body
    if (!kode || !nama || !kelompok || !kelas || !jpm) {
      return res.status(400).json({ message: 'Kode, nama, kelompok, kelas, dan JPM wajib diisi' })
    }

    const savedMapel = await getJsonSetting('mapel', [])
    const deletedMapel = await getJsonSetting('deleted_mapel', [])
    const payload = { kode, nama, kelompok, kelas, jpm: Number(jpm) || 1 }
    const nextMapel = savedMapel.some(item => item.kode === kode)
      ? savedMapel.map(item => item.kode === kode ? payload : item)
      : [...savedMapel, payload]

    await setJsonSetting('mapel', nextMapel)
    await setJsonSetting('deleted_mapel', deletedMapel.filter(item => item.kode !== kode && item.nama !== nama))
    if (guruNip) {
      await query('UPDATE guru SET mapel = ? WHERE nip = ?', [nama, guruNip])
    }

    const teachers = await query('SELECT nip, nama FROM guru WHERE mapel = ? AND status <> ? ORDER BY nama ASC', [nama, 'Pensiun'])
    res.status(201).json({
      ...payload,
      guru: teachers.map(g => g.nama).join(', '),
      guruNip: teachers[0]?.nip || '',
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/mapel/:kode', async (req, res, next) => {
  try {
    const savedMapel = await getJsonSetting('mapel', [])
    const deletedMapel = await getJsonSetting('deleted_mapel', [])
    const existing = savedMapel.find(item => item.kode === req.params.kode)
    const dbMapel = await query(
      `SELECT DISTINCT mapel AS nama
       FROM (
         SELECT mapel FROM jadwal
         UNION
         SELECT mapel FROM nilai
         UNION
         SELECT mapel FROM guru
       ) sources
       WHERE mapel <> ''`,
    )
    const matchedNames = dbMapel
      .map(item => item.nama)
      .filter(nama => mapelCode(nama) === req.params.kode)
    const deletedItems = [
      ...deletedMapel,
      ...[existing?.nama, ...matchedNames]
        .filter(Boolean)
        .map(nama => ({ kode: req.params.kode, nama })),
    ]
    const uniqueDeleted = Array.from(new Map(deletedItems.map(item => [`${item.kode}:${item.nama}`, item])).values())

    await setJsonSetting('mapel', savedMapel.filter(item => item.kode !== req.params.kode))
    await setJsonSetting('deleted_mapel', uniqueDeleted)
    for (const nama of [existing?.nama, ...matchedNames].filter(Boolean)) {
      await query('DELETE FROM jadwal WHERE mapel_kode = ? OR (mapel = ? AND (mapel_kode IS NULL OR mapel_kode = ""))', [req.params.kode, nama])
      await query('DELETE FROM nilai WHERE mapel = ?', [nama])
    }
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/kelas', async (_req, res, next) => {
  try {
    const savedKelas = await getJsonSetting('kelas', [])
    const deletedKelas = await getJsonSetting('deleted_kelas', [])
    const deletedNames = new Set(deletedKelas)
    const siswaCounts = await query('SELECT kelas AS nama, COUNT(*) AS total FROM siswa GROUP BY kelas')
    const jadwalKelas = await query('SELECT DISTINCT kelas AS nama, ruang FROM jadwal ORDER BY kelas ASC')
    const byName = new Map(savedKelas.filter(item => !deletedNames.has(item.nama)).map(item => [item.nama, item]))

    for (const item of [...siswaCounts, ...jadwalKelas]) {
      if (!item.nama || deletedNames.has(item.nama) || byName.has(item.nama)) continue
      byName.set(item.nama, {
        nama: item.nama,
        wali: '',
        jmlSiswa: 0,
        kapasitas: 32,
        ruang: item.ruang || '',
      })
    }

    const countMap = new Map(siswaCounts.map(item => [item.nama, Number(item.total || 0)]))
    const kelas = Array.from(byName.values())
      .map(item => ({ ...item, jmlSiswa: countMap.get(item.nama) || 0 }))
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))

    res.json(kelas)
  } catch (error) {
    next(error)
  }
})

app.post('/api/kelas', async (req, res, next) => {
  try {
    const { idKelas = '', nama, wali, kapasitas, ruang } = req.body
    if (!nama || !wali || !ruang || kapasitas === undefined) {
      return res.status(400).json({ message: 'Nama kelas, wali kelas, ruang, dan kapasitas wajib diisi' })
    }

    const savedKelas = await getJsonSetting('kelas', [])
    const deletedKelas = await getJsonSetting('deleted_kelas', [])
    const [count] = await query('SELECT COUNT(*) AS total FROM siswa WHERE kelas = ?', [nama])
    const payload = { idKelas, nama, wali, ruang, kapasitas: Number(kapasitas) || 32, jmlSiswa: Number(count?.total || 0) }
    const nextKelas = savedKelas.some(item => item.nama === nama)
      ? savedKelas.map(item => item.nama === nama ? payload : item)
      : [...savedKelas, payload]

    await setJsonSetting('kelas', nextKelas)
    await setJsonSetting('deleted_kelas', deletedKelas.filter(item => item !== nama))
    res.status(201).json(payload)
  } catch (error) {
    next(error)
  }
})

app.put('/api/kelas/:nama', async (req, res, next) => {
  try {
    const oldNama = req.params.nama
    const { idKelas = '', nama, wali, kapasitas, ruang } = req.body
    if (!nama || !wali || !ruang || kapasitas === undefined) {
      return res.status(400).json({ message: 'Nama kelas, wali kelas, ruang, dan kapasitas wajib diisi' })
    }

    const savedKelas = await getJsonSetting('kelas', [])
    const deletedKelas = await getJsonSetting('deleted_kelas', [])
    const normalizedName = String(nama).trim()
    const duplicate = oldNama !== normalizedName && savedKelas.some(item => item.nama === normalizedName)
    if (duplicate) {
      return res.status(409).json({ message: 'Nama kelas sudah digunakan' })
    }

    if (oldNama !== normalizedName) {
      await query('UPDATE siswa SET kelas = ? WHERE kelas = ?', [normalizedName, oldNama])
      await query('UPDATE jadwal SET kelas = ? WHERE kelas = ?', [normalizedName, oldNama])
      await query('UPDATE materi_tugas SET kelas = ? WHERE kelas = ?', [normalizedName, oldNama])
      await query('UPDATE tugas_submissions SET kelas = ? WHERE kelas = ?', [normalizedName, oldNama])
    }

    const [count] = await query('SELECT COUNT(*) AS total FROM siswa WHERE kelas = ?', [normalizedName])
    const payload = {
      idKelas: String(idKelas || '').trim(),
      nama: normalizedName,
      wali: String(wali).trim(),
      ruang: String(ruang).trim(),
      kapasitas: Number(kapasitas) || 32,
      jmlSiswa: Number(count?.total || 0),
    }
    const withoutOld = savedKelas.filter(item => item.nama !== oldNama && item.nama !== normalizedName)
    await setJsonSetting('kelas', [...withoutOld, payload])
    await setJsonSetting('deleted_kelas', deletedKelas.filter(item => item !== oldNama && item !== normalizedName))
    res.json(payload)
  } catch (error) {
    next(error)
  }
})

app.post('/api/kelas/:nama/archive', async (req, res, next) => {
  try {
    const nama = req.params.nama
    const savedKelas = await getJsonSetting('kelas', [])
    const deletedKelas = await getJsonSetting('deleted_kelas', [])
    const [kelasData] = savedKelas.filter(item => item.nama === nama)
    const [count] = await query('SELECT COUNT(*) AS total FROM siswa WHERE kelas = ?', [nama])
    const siswa = await query(
      `SELECT nisn, nama, kelas, jk, status, password_hash AS passwordHash
       FROM siswa
       WHERE kelas = ?
       ORDER BY nama ASC`,
      [nama],
    )
    const siswaAktif = siswa.filter(item => item.status === 'Aktif')

    if (siswaAktif.length > 0) {
      return res.status(409).json({ message: 'Kelas tidak dapat diarsipkan karena masih terdapat siswa aktif.' })
    }

    const payloadKelas = {
      idKelas: kelasData?.idKelas || '',
      nama,
      wali: kelasData?.wali || '',
      ruang: kelasData?.ruang || '',
      kapasitas: Number(kelasData?.kapasitas || 32),
      jmlSiswa: Number(count?.total || 0),
    }
    const arsip = await getJsonSetting('arsip', { items: [] })
    const currentItems = Array.isArray(arsip?.items) ? arsip.items : []
    const archiveItem = {
      id: `kelas-${nama}-${Date.now()}`,
      type: 'Kelas',
      label: nama,
      detail: `${payloadKelas.ruang || '-'} - ${siswa.length} siswa ikut diarsipkan`,
      archivedAt: new Date().toISOString(),
      data: {
        kelas: payloadKelas,
        siswa,
      },
    }

    await setJsonSetting('arsip', { items: [archiveItem, ...currentItems] })
    await setJsonSetting('kelas', savedKelas.filter(item => item.nama !== nama))
    await setJsonSetting('deleted_kelas', Array.from(new Set([...deletedKelas, nama])))
    await query('DELETE FROM jadwal WHERE kelas = ?', [nama])
    await query('DELETE FROM siswa WHERE kelas = ?', [nama])
    for (const row of siswa) {
      await deleteLoginUser(row.nisn, 'siswa')
    }

    res.status(201).json(archiveItem)
  } catch (error) {
    next(error)
  }
})

app.post('/api/kelas/archive/restore', async (req, res, next) => {
  try {
    const data = req.body || {}
    const kelas = data.kelas || data
    const siswa = Array.isArray(data.siswa) ? data.siswa : []

    if (!kelas?.nama) {
      return res.status(400).json({ message: 'Data kelas arsip tidak valid' })
    }

    const savedKelas = await getJsonSetting('kelas', [])
    const deletedKelas = await getJsonSetting('deleted_kelas', [])
    const [count] = await query('SELECT COUNT(*) AS total FROM siswa WHERE kelas = ?', [kelas.nama])
    const payload = {
      idKelas: kelas.idKelas || '',
      nama: kelas.nama,
      wali: kelas.wali || '',
      ruang: kelas.ruang || '',
      kapasitas: Number(kelas.kapasitas || 32),
      jmlSiswa: Number(count?.total || siswa.length || 0),
    }
    const nextKelas = savedKelas.some(item => item.nama === payload.nama)
      ? savedKelas.map(item => item.nama === payload.nama ? payload : item)
      : [...savedKelas, payload]

    await setJsonSetting('kelas', nextKelas)
    await setJsonSetting('deleted_kelas', deletedKelas.filter(item => item !== payload.nama))

    for (const row of siswa) {
      if (!row.nisn || !row.nama || !row.kelas || !row.jk || !row.status || !row.passwordHash) continue
      await query(
        `INSERT INTO siswa (nisn, nama, kelas, jk, status, password_hash)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nama = VALUES(nama),
           kelas = VALUES(kelas),
           jk = VALUES(jk),
           status = VALUES(status),
           password_hash = VALUES(password_hash)`,
        [row.nisn, row.nama, row.kelas, row.jk, row.status, row.passwordHash],
      )
      await query(
        `INSERT INTO users (username, password_hash, role, name)
         VALUES (?, ?, 'siswa', ?)
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           role = VALUES(role),
           name = VALUES(name)`,
        [row.nisn, row.passwordHash, row.nama],
      )
    }

    const [restored] = await query('SELECT COUNT(*) AS total FROM siswa WHERE kelas = ?', [payload.nama])
    res.json({ ...payload, jmlSiswa: Number(restored?.total || payload.jmlSiswa) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/kelas/:nama', async (req, res, next) => {
  try {
    const savedKelas = await getJsonSetting('kelas', [])
    const deletedKelas = await getJsonSetting('deleted_kelas', [])
    await setJsonSetting('kelas', savedKelas.filter(item => item.nama !== req.params.nama))
    await setJsonSetting('deleted_kelas', Array.from(new Set([...deletedKelas, req.params.nama])))
    await query('DELETE FROM jadwal WHERE kelas = ?', [req.params.nama])
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

function buildJadwalGuru(guru) {
  if (!guru) return []

  return [
    { jam: '07:00 - 08:30', kelas: 'X IPA 1', mapel: guru.mapel, ruang: 'R-101', status: 'Selesai' },
    { jam: '08:30 - 10:00', kelas: 'X IPA 2', mapel: guru.mapel, ruang: 'R-102', status: 'Sedang Berlangsung' },
    { jam: '10:00 - 10:30', kelas: '-', mapel: 'Istirahat', ruang: '-', status: '-' },
    { jam: '10:30 - 12:00', kelas: 'X IPS 1', mapel: guru.mapel, ruang: 'R-103', status: 'Mendatang' },
  ]
}

function buildJadwalSiswa(guru) {
  const guruMap = new Map(guru.map(item => [item.mapel, item.nama]))

  return [
    { jam: '07:00 - 08:30', mapel: 'Matematika', guru: guruMap.get('Matematika') || '-', ruang: 'R-101', status: 'Selesai' },
    { jam: '08:30 - 10:00', mapel: 'Bahasa Indonesia', guru: guruMap.get('Bahasa Indonesia') || '-', ruang: 'R-101', status: 'Sedang Berlangsung' },
    { jam: '10:00 - 10:30', mapel: 'Istirahat', guru: '-', ruang: '-', status: '-' },
    { jam: '10:30 - 12:00', mapel: 'Biologi', guru: guruMap.get('Biologi') || '-', ruang: 'R-101', status: 'Mendatang' },
  ]
}

app.get('/api/dashboard/admin', async (_req, res, next) => {
  try {
    const [siswaCount] = await query('SELECT COUNT(*) AS total FROM siswa')
    const [guruCount] = await query('SELECT COUNT(*) AS total FROM guru')
    const kelas = await query('SELECT kelas, COUNT(*) AS total FROM siswa GROUP BY kelas ORDER BY kelas ASC')
    const mapel = await query('SELECT DISTINCT mapel FROM guru ORDER BY mapel ASC')

    res.json({
      totalSiswa: Number(siswaCount?.total || 0),
      totalGuru: Number(guruCount?.total || 0),
      totalKelas: kelas.length,
      totalMapel: mapel.length,
      kelas,
      mapel: mapel.map(item => item.mapel),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/dashboard/guru/:nip', async (req, res, next) => {
  try {
    const guru = await query(
      `SELECT nip, nama, mapel, jk, status
       FROM guru
       WHERE nip = ?
       LIMIT 1`,
      [req.params.nip],
    )

    if (guru.length === 0) {
      return res.status(404).json({ message: 'Data guru tidak ditemukan' })
    }

    const kelas = await query('SELECT kelas, COUNT(*) AS total FROM siswa WHERE status = ? GROUP BY kelas ORDER BY kelas ASC', ['Aktif'])
    const totalSiswa = kelas.reduce((sum, item) => sum + Number(item.total || 0), 0)
    const jadwal = await query(
      `SELECT jam, kelas, mapel, ruang, status
       FROM jadwal
       WHERE guru_nip = ? AND hari = ?
       ORDER BY jam_ke ASC`,
      [req.params.nip, todayName()],
    )

    res.json({
      guru: guru[0],
      jadwalHariIni: jadwal,
      tugasMenunggu: [
        { task: `Input nilai ${guru[0].mapel} kelas X IPA 1`, deadline: 'Hari ini', type: 'nilai' },
        { task: 'Input absensi kelas X IPA 2', deadline: 'Hari ini', type: 'absensi' },
        { task: `Unggah materi ${guru[0].mapel}`, deadline: '22 Jan 2026', type: 'tugas' },
      ],
      ringkasan: {
        totalSiswa,
        totalKelas: kelas.length,
        totalMapel: 1,
        jpMinggu: 12,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/dashboard/siswa/:nisn', async (req, res, next) => {
  try {
    const siswa = await query(
      `SELECT nisn, nama, kelas, jk, status
       FROM siswa
       WHERE nisn = ?
       LIMIT 1`,
      [req.params.nisn],
    )

    if (siswa.length === 0) {
      return res.status(404).json({ message: 'Data siswa tidak ditemukan' })
    }

    const jadwal = await query(
      `SELECT j.jam, j.mapel, COALESCE(g.nama, '-') AS guru, j.ruang, j.status
       FROM jadwal j
       LEFT JOIN guru g ON g.nip = j.guru_nip
       WHERE j.kelas = ? AND j.hari = ?
       ORDER BY j.jam_ke ASC`,
      [siswa[0].kelas, todayName()],
    )
    await ensureNilaiScoreColumns()
    const nilai = await query(
      `SELECT mapel, nh, tugas, pts, pas, na
       FROM nilai
       WHERE nisn = ?
       ORDER BY id ASC`,
      [req.params.nisn],
    )
    const pengumuman = await query(
      `SELECT judul, isi, kategori, tanggal AS waktu, penting, 'Admin' AS sumber, created_at
       FROM pengumuman
       WHERE status = ?
         AND (target IN ('Semua', 'Siswa') OR target = ?)
       ORDER BY created_at DESC, id DESC`,
      ['Dipublikasikan', siswa[0].kelas],
    )
    const materiTugas = await query(
      `SELECT
         judul,
         deskripsi AS isi,
         CASE WHEN tipe = 'tugas' THEN 'Tugas' ELSE 'Materi' END AS kategori,
         tanggal AS waktu,
         CASE WHEN tipe = 'tugas' THEN 1 ELSE 0 END AS penting,
         guru AS sumber,
         created_at
       FROM materi_tugas
       WHERE kelas = ?
       ORDER BY created_at DESC, id DESC`,
      [siswa[0].kelas],
    )
    const informasiTerbaru = [...pengumuman, ...materiTugas]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .map(item => ({
        judul: item.judul,
        isi: item.isi,
        kategori: item.kategori,
        waktu: item.waktu,
        penting: Boolean(item.penting),
        sumber: item.sumber,
      }))
    const [absensi] = await query(
      `SELECT
         COALESCE(SUM(hadir), 0) AS hadir,
         COALESCE(SUM(sakit), 0) AS sakit,
         COALESCE(SUM(izin), 0) AS izin,
         COALESCE(SUM(alpa), 0) AS alpa
       FROM absensi
       WHERE nisn = ?`,
      [req.params.nisn],
    )

    res.json({
      siswa: siswa[0],
      jadwalHariIni: jadwal,
      ringkasanNilai: nilai,
      pengumumanTerbaru: informasiTerbaru,
      absensi: absensi || { hadir: 0, sakit: 0, izin: 0, alpa: 0 },
    })
  } catch (error) {
    next(error)
  }
})

const jamSeninKamis = [
  { jam: '07:00 - 07:45', ke: 1 },
  { jam: '07:45 - 08:30', ke: 2 },
  { jam: '08:30 - 09:15', ke: 3 },
  { jam: '09:15 - 09:45', ke: 4 },
  { jam: '10:15 - 11:00', ke: 5 },
  { jam: '11:00 - 11:45', ke: 6 },
  { jam: '11:45 - 12:30', ke: 7 },
  { jam: '13:15 - 14:00', ke: 8 },
  { jam: '14:00 - 14:45', ke: 9 },
  { jam: '14:45 - 15:30', ke: 10 },
]
const jamJumat = [
  { jam: '07:00 - 07:45', ke: 1 },
  { jam: '07:45 - 08:30', ke: 2 },
  { jam: '08:30 - 09:15', ke: 3 },
  { jam: '09:15 - 10:00', ke: 4 },
  { jam: '10:00 - 10:45', ke: 5 },
  { jam: '10:45 - 11:15', ke: 6 },
]

function jamForKe(jamKe, hari = '') {
  const daftarJam = hari === 'Jumat' ? jamJumat : jamSeninKamis
  return daftarJam.find(item => item.ke === Number(jamKe))?.jam || ''
}

app.get('/api/jadwal', async (req, res, next) => {
  try {
    const { kelas, guru_nip, tahun_ajaran, semester } = req.query
    const params = []
    const where = []

    if (kelas) {
      where.push('j.kelas = ?')
      params.push(kelas)
    }
    if (guru_nip) {
      where.push('j.guru_nip = ?')
      params.push(guru_nip)
    }
    if (tahun_ajaran) {
      where.push('j.tahun_ajaran = ?')
      params.push(tahun_ajaran)
    }
    if (semester) {
      where.push('j.semester = ?')
      params.push(semester)
    }

    const jadwal = await query(
      `SELECT j.id, j.hari, j.jam_ke AS jamKe, j.jam, j.kelas, j.tahun_ajaran AS tahunAjaran,
              j.semester, j.mapel_kode AS mapelKode, j.mapel, j.guru_nip AS guruNip,
              COALESCE(g.nama, '-') AS guru, j.ruang, j.status
       FROM jadwal j
       LEFT JOIN guru g ON g.nip = j.guru_nip
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'), j.jam_ke, j.kelas`,
      params,
    )

    res.json(jadwal)
  } catch (error) {
    next(error)
  }
})

app.post('/api/jadwal/upsert', async (req, res, next) => {
  try {
    const { hari, jamKe, kelas, tahunAjaran = '2025/2026', semester = 'Genap', mapel, mapelKode = '', guruNip, ruang = 'R-101', status = 'Mendatang' } = req.body

    if (!hari || !jamKe || !kelas || !tahunAjaran || !semester || !mapel || !guruNip) {
      return res.status(400).json({ message: 'Hari, jam, kelas, tahun ajaran, semester, mapel, dan guru wajib diisi' })
    }
    if (!jamForKe(jamKe, hari)) {
      return res.status(400).json({ message: hari === 'Jumat' ? 'Hari Jumat hanya sampai jam pelajaran ke-6' : 'Jam pelajaran tidak valid' })
    }

    const guru = await query('SELECT nip, nama, mapel FROM guru WHERE nip = ? LIMIT 1', [guruNip])
    if (guru.length === 0) {
      return res.status(404).json({ message: 'Guru tidak ditemukan' })
    }

    const conflicts = await query(
      `SELECT j.kelas, j.hari, j.jam_ke AS jamKe, g.nama AS guru
       FROM jadwal j
       LEFT JOIN guru g ON g.nip = j.guru_nip
       WHERE j.hari = ? AND j.jam_ke = ? AND j.guru_nip = ? AND j.kelas <> ?
         AND j.tahun_ajaran = ? AND j.semester = ?
       LIMIT 1`,
      [hari, jamKe, guruNip, kelas, tahunAjaran, semester],
    )

    if (conflicts.length > 0) {
      return res.status(409).json({ message: `${guru[0].nama} sudah mengajar ${conflicts[0].kelas} pada ${hari} jam ke-${jamKe}` })
    }

    await query(
      `INSERT INTO jadwal (hari, jam_ke, jam, kelas, tahun_ajaran, semester, mapel_kode, mapel, guru_nip, ruang, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         jam = VALUES(jam),
         mapel_kode = VALUES(mapel_kode),
         mapel = VALUES(mapel),
         guru_nip = VALUES(guru_nip),
         ruang = VALUES(ruang),
         status = VALUES(status)`,
      [hari, jamKe, jamForKe(jamKe, hari), kelas, tahunAjaran, semester, mapelKode, mapel, guruNip, ruang, status],
    )

    const [saved] = await query(
      `SELECT j.id, j.hari, j.jam_ke AS jamKe, j.jam, j.kelas, j.tahun_ajaran AS tahunAjaran,
              j.semester, j.mapel_kode AS mapelKode, j.mapel, j.guru_nip AS guruNip,
              g.nama AS guru, j.ruang, j.status
       FROM jadwal j
       LEFT JOIN guru g ON g.nip = j.guru_nip
       WHERE j.hari = ? AND j.jam_ke = ? AND j.kelas = ? AND j.tahun_ajaran = ? AND j.semester = ?
       LIMIT 1`,
      [hari, jamKe, kelas, tahunAjaran, semester],
    )

    res.json(saved)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/jadwal', async (req, res, next) => {
  try {
    const { hari, jamKe, kelas, tahunAjaran = '2025/2026', semester = 'Genap' } = req.body
    await query('DELETE FROM jadwal WHERE hari = ? AND jam_ke = ? AND kelas = ? AND tahun_ajaran = ? AND semester = ?', [hari, jamKe, kelas, tahunAjaran, semester])
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/materi-tugas', async (req, res, next) => {
  try {
    const { guru_nip, kelas } = req.query
    const params = []
    const where = []

    if (guru_nip) {
      where.push('guru_nip = ?')
      params.push(guru_nip)
    }
    if (kelas) {
      where.push('kelas = ?')
      params.push(kelas)
    }

    const rows = await query(
      `SELECT id, judul, tipe, mapel, kelas, guru_nip AS guruNip, guru, tanggal, deskripsi,
              file_name AS fileName, file_type AS fileType, file_data AS fileData, deadline
       FROM materi_tugas
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY created_at DESC`,
      params,
    )

    res.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/materi-tugas', async (req, res, next) => {
  try {
    const { id, judul, tipe, mapel, kelas, guruNip, guru, tanggal, deskripsi, fileName, fileType, fileData, deadline } = req.body

    if (!judul || !tipe || !mapel || !kelas || !guruNip || !guru || !deskripsi) {
      return res.status(400).json({ message: 'Judul, tipe, mapel, kelas, guru, dan deskripsi wajib diisi' })
    }

    const itemId = id || crypto.randomUUID()
    await query(
      `INSERT INTO materi_tugas (id, judul, tipe, mapel, kelas, guru_nip, guru, tanggal, deskripsi, file_name, file_type, file_data, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         judul = VALUES(judul),
         tipe = VALUES(tipe),
         mapel = VALUES(mapel),
         kelas = VALUES(kelas),
         guru_nip = VALUES(guru_nip),
         guru = VALUES(guru),
         tanggal = VALUES(tanggal),
         deskripsi = VALUES(deskripsi),
         file_name = VALUES(file_name),
         file_type = VALUES(file_type),
         file_data = VALUES(file_data),
         deadline = VALUES(deadline)`,
      [itemId, judul, tipe, mapel, kelas, guruNip, guru, tanggal || new Date().toLocaleDateString('id-ID'), deskripsi, fileName || null, fileType || null, fileData || null, tipe === 'tugas' ? deadline || null : null],
    )

    res.status(201).json({ id: itemId, judul, tipe, mapel, kelas, guruNip, guru, tanggal, deskripsi, fileName, fileType, fileData, deadline })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/materi-tugas/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM materi_tugas WHERE id = ?', [req.params.id])
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/tugas-submissions', async (req, res, next) => {
  try {
    const where = []
    const params = []

    if (req.query.tugas_id) {
      where.push('ts.tugas_id = ?')
      params.push(req.query.tugas_id)
    }
    if (req.query.nisn) {
      where.push('ts.nisn = ?')
      params.push(req.query.nisn)
    }
    if (req.query.kelas) {
      where.push('ts.kelas = ?')
      params.push(req.query.kelas)
    }
    if (req.query.guru_nip) {
      where.push('mt.guru_nip = ?')
      params.push(req.query.guru_nip)
    }

    const rows = await query(
      `SELECT ts.id, ts.tugas_id AS tugasId, ts.nisn, ts.nama, ts.kelas,
              ts.file_name AS fileName, ts.file_type AS fileType, ts.file_data AS fileData,
              ts.catatan, ts.submitted_at AS submittedAt, ts.updated_at AS updatedAt
       FROM tugas_submissions ts
       INNER JOIN materi_tugas mt ON mt.id = ts.tugas_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY ts.submitted_at DESC, ts.id DESC`,
      params,
    )

    res.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/tugas-submissions', async (req, res, next) => {
  try {
    const { tugasId, nisn, nama, kelas, fileName, fileType, fileData, catatan } = req.body

    if (!tugasId || !nisn || !nama || !kelas || !fileName || !fileData) {
      return res.status(400).json({ message: 'Tugas, siswa, kelas, dan file wajib diisi' })
    }

    await query(
      `INSERT INTO tugas_submissions (tugas_id, nisn, nama, kelas, file_name, file_type, file_data, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nama = VALUES(nama),
         kelas = VALUES(kelas),
         file_name = VALUES(file_name),
         file_type = VALUES(file_type),
         file_data = VALUES(file_data),
         catatan = VALUES(catatan),
         submitted_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`,
      [tugasId, nisn, nama, kelas, fileName, fileType || null, fileData, catatan || null],
    )

    const rows = await query(
      `SELECT id, tugas_id AS tugasId, nisn, nama, kelas, file_name AS fileName,
              file_type AS fileType, file_data AS fileData, catatan,
              submitted_at AS submittedAt, updated_at AS updatedAt
       FROM tugas_submissions
       WHERE tugas_id = ? AND nisn = ?
       LIMIT 1`,
      [tugasId, nisn],
    )

    res.status(201).json(rows[0] || {
      tugasId,
      nisn,
      nama,
      kelas,
      fileName,
      fileType: fileType || null,
      fileData,
      catatan: catatan || null,
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/tugas-submissions/:tugasId', async (req, res, next) => {
  try {
    const tugasId = req.params.tugasId
    const nisn = String(req.query.nisn || '').trim()

    if (!tugasId || !nisn) {
      return res.status(400).json({ message: 'Tugas dan siswa wajib diisi' })
    }

    const tugas = await query('SELECT deadline FROM materi_tugas WHERE id = ? LIMIT 1', [tugasId])
    if (tugas.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' })
    }
    if (tugas[0].deadline) {
      const [deadlineCheck] = await query('SELECT CASE WHEN CURDATE() <= ? THEN 1 ELSE 0 END AS canDelete', [tugas[0].deadline])
      if (!deadlineCheck?.canDelete) {
        return res.status(403).json({ message: 'Tugas tidak dapat dihapus karena sudah melewati deadline' })
      }
    }

    const result = await query('DELETE FROM tugas_submissions WHERE tugas_id = ? AND nisn = ?', [tugasId, nisn])
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pengumpulan tugas tidak ditemukan' })
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/pengumuman', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, judul, kategori, target, tanggal, status, isi, penting
       FROM pengumuman
       ORDER BY created_at DESC, id DESC`,
    )
    res.json(rows.map(item => ({ ...item, penting: Boolean(item.penting) })))
  } catch (error) {
    next(error)
  }
})

app.post('/api/pengumuman', async (req, res, next) => {
  try {
    const { id, judul, kategori, target, tanggal, status = 'Dipublikasikan', isi, penting = false } = req.body

    if (!judul || !kategori || !target || !isi) {
      return res.status(400).json({ message: 'Judul, kategori, target, dan isi pengumuman wajib diisi' })
    }

    const itemId = id || crypto.randomUUID()
    const itemTanggal = tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    await query(
      `INSERT INTO pengumuman (id, judul, kategori, target, tanggal, penting, status, isi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         judul = VALUES(judul),
         kategori = VALUES(kategori),
         target = VALUES(target),
         tanggal = VALUES(tanggal),
         penting = VALUES(penting),
         status = VALUES(status),
         isi = VALUES(isi)`,
      [itemId, judul, kategori, target, itemTanggal, penting ? 1 : 0, status, isi],
    )

    res.status(201).json({ id: itemId, judul, kategori, target, tanggal: itemTanggal, status, isi, penting: Boolean(penting) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/pengumuman/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM pengumuman WHERE id = ?', [req.params.id])
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/nilai', async (req, res, next) => {
  try {
    await ensureNilaiScoreColumns()
    const { nisn } = req.query
    const rows = await query(
      `SELECT n.nisn, s.nama, s.kelas, n.mapel, n.nh, n.tugas, n.pts, n.pas, n.na
       FROM nilai n
       LEFT JOIN siswa s ON s.nisn = n.nisn
       ${nisn ? 'WHERE n.nisn = ?' : ''}
       ORDER BY n.mapel ASC`,
      nisn ? [nisn] : [],
    )
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/nilai/bulk', async (req, res, next) => {
  try {
    await ensureNilaiScoreColumns()
    const { entries } = req.body
    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: 'Data nilai tidak valid' })
    }

    for (const entry of entries) {
      const { nisn, mapel, nh = 0, tugas = 0, pts = 0, pas = 0, na = 0 } = entry
      if (!nisn || !mapel) continue
      await query(
        `INSERT INTO nilai (nisn, mapel, nh, tugas, pts, pas, na)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nh = VALUES(nh),
           tugas = VALUES(tugas),
           pts = VALUES(pts),
           pas = VALUES(pas),
           na = VALUES(na)`,
        [nisn, mapel, Number(nh) || 0, Number(tugas) || 0, Number(pts) || 0, Number(pas) || 0, Number(na) || 0],
      )
    }

    res.json({ saved: entries.length })
  } catch (error) {
    next(error)
  }
})

app.get('/api/prestasi', async (_req, res, next) => {
  try {
    await ensurePrestasiTable()
    const rows = await query(
      `SELECT id, judul, kategori, deskripsi, gambar, tanggal
       FROM prestasi
       ORDER BY created_at DESC, id DESC`,
    )
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/prestasi', async (req, res, next) => {
  try {
    await ensurePrestasiTable()
    const { id, judul, kategori, deskripsi, gambar, tanggal } = req.body
    if (!judul || !kategori || !deskripsi) {
      return res.status(400).json({ message: 'Judul, kategori, dan deskripsi prestasi wajib diisi' })
    }

    const itemId = id || crypto.randomUUID()
    const itemTanggal = tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    await query(
      `INSERT INTO prestasi (id, judul, kategori, deskripsi, gambar, tanggal)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         judul = VALUES(judul),
         kategori = VALUES(kategori),
         deskripsi = VALUES(deskripsi),
         gambar = VALUES(gambar),
         tanggal = VALUES(tanggal)`,
      [itemId, judul, kategori, deskripsi, gambar || null, itemTanggal],
    )

    res.status(201).json({ id: itemId, judul, kategori, deskripsi, gambar, tanggal: itemTanggal })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/prestasi/:id', async (req, res, next) => {
  try {
    await ensurePrestasiTable()
    await query('DELETE FROM prestasi WHERE id = ?', [req.params.id])
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/absensi/kelas/:kelas', async (req, res, next) => {
  try {
    const tanggal = req.query.tanggal || new Date().toISOString().slice(0, 10)
    const siswa = await query(
      `SELECT s.nisn, s.nama, COALESCE(a.hadir, 0) AS hadir, COALESCE(a.sakit, 0) AS sakit,
              COALESCE(a.izin, 0) AS izin, COALESCE(a.alpa, 0) AS alpa
       FROM siswa s
       LEFT JOIN absensi a ON a.nisn = s.nisn AND a.tanggal = ?
       WHERE s.kelas = ? AND s.status = 'Aktif'
       ORDER BY s.nama ASC`,
      [tanggal, req.params.kelas],
    )
    res.json(siswa)
  } catch (error) {
    next(error)
  }
})

app.post('/api/absensi', async (req, res, next) => {
  try {
    const { tanggal = new Date().toISOString().slice(0, 10), entries = [] } = req.body
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const bulan = namaBulan[Number(String(tanggal).slice(5, 7)) - 1] || 'Januari'

    for (const entry of entries) {
      await query(
        `INSERT INTO absensi (nisn, tanggal, bulan, hadir, sakit, izin, alpa)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           bulan = VALUES(bulan),
           hadir = VALUES(hadir),
           sakit = VALUES(sakit),
           izin = VALUES(izin),
           alpa = VALUES(alpa)`,
        [entry.nisn, tanggal, bulan, entry.hadir || 0, entry.sakit || 0, entry.izin || 0, entry.alpa || 0],
      )
    }

    res.json({ saved: entries.length })
  } catch (error) {
    next(error)
  }
})

app.get('/api/absensi/siswa/:nisn', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal, bulan, hadir, sakit, izin, alpa
       FROM absensi
       WHERE nisn = ? AND tanggal IS NOT NULL
       ORDER BY tanggal DESC, id DESC`,
      [req.params.nisn],
    )
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/contact', async (req, res, next) => {
  try {
    const { nama, email, subjek, telepon = '', pesan } = req.body
    if (!nama || !email || !subjek || !pesan) {
      return res.status(400).json({ message: 'Nama, email, subjek, dan pesan wajib diisi' })
    }

    const tujuanEmail = process.env.CONTACT_TO_EMAIL || 'seccondgilang@gmail.com'
    await query(
      `INSERT INTO pesan_kontak (nama, email, subjek, telepon, pesan, tujuan_email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nama, email, subjek, telepon, pesan, tujuanEmail],
    )

    if (!isMailConfigured()) {
      return res.status(503).json({
        message: 'Pesan tersimpan, tetapi email belum terkirim karena SMTP Gmail belum dikonfigurasi di server.',
      })
    }

    const transporter = createMailTransporter()
    await transporter.sendMail({
      from: `"SIAKAD SMAN 3 Surabaya" <${process.env.SMTP_USER}>`,
      to: tujuanEmail,
      replyTo: email,
      subject: `[Kontak SIAKAD] ${subjek}`,
      text: [
        `Nama: ${nama}`,
        `Email: ${email}`,
        `Telepon: ${telepon || '-'}`,
        `Subjek: ${subjek}`,
        '',
        pesan,
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Pesan Baru dari Form Kontak SIAKAD</h2>
          <p><strong>Nama:</strong> ${escapeHtml(nama)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Telepon:</strong> ${escapeHtml(telepon || '-')}</p>
          <p><strong>Subjek:</strong> ${escapeHtml(subjek)}</p>
          <hr />
          <p>${escapeHtml(pesan).replace(/\n/g, '<br />')}</p>
        </div>
      `,
    })

    res.status(201).json({ message: `Pesan berhasil dikirim langsung ke ${tujuanEmail}` })
  } catch (error) {
    next(error)
  }
})

app.get('/api/settings', async (_req, res, next) => {
  try {
    const settings = await query('SELECT setting_key AS settingKey, setting_value AS settingValue FROM settings')
    const accounts = await query(
      `SELECT username, name AS nama, role, 'Aktif' AS status
       FROM users
       ORDER BY FIELD(role, 'admin', 'guru', 'siswa'), name ASC`,
    )

    res.json({
      settings: Object.fromEntries(settings.map(item => [item.settingKey, typeof item.settingValue === 'string' ? JSON.parse(item.settingValue) : item.settingValue])),
      accounts,
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/settings/:key', async (req, res, next) => {
  try {
    await query(
      `INSERT INTO settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [req.params.key, JSON.stringify(req.body)],
    )

    res.json({ settingKey: req.params.key, settingValue: req.body })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/backup', async (_req, res, next) => {
  try {
    const tables = ['users', 'siswa', 'guru', 'jadwal', 'nilai', 'absensi', 'pengumuman', 'materi_tugas', 'tugas_submissions', 'prestasi', 'pesan_kontak', 'settings']
    const data = {}
    for (const table of tables) {
      data[table] = await query(`SELECT * FROM ${table}`)
    }
    res.json({ exportedAt: new Date().toISOString(), data })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/reset-database', async (_req, res, next) => {
  try {
    const seed = await fs.readFile(path.join(databaseDir, 'seed.sql'), 'utf8')
    const statements = seed
      .split(/;\s*(?:\r?\n|$)/)
      .map(statement => statement.trim())
      .filter(Boolean)

    for (const statement of statements) {
      await query(statement)
    }

    res.json({ message: 'Database berhasil direset ke data awal' })
  } catch (error) {
    next(error)
  }
})

const publicDir = path.resolve(__dirname, '..', 'public')
app.use(express.static(publicDir))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(publicDir, 'index.html'))
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Terjadi kesalahan pada server' })
})

app.listen(port, () => {
  console.log(`SIAKAD API berjalan di http://localhost:${port}`)
})
