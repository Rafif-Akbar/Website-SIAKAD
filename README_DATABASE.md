# SIAKAD SMAGA - Persiapan Database MySQL

Proyek ini sudah disiapkan menjadi dua bagian:

- `src/` untuk frontend React/Vite.
- `server/` untuk backend Express yang terhubung ke MySQL.

## 1. Buat database

Buka MySQL/phpMyAdmin, lalu import file berikut secara berurutan:

1. `server/database/schema.sql`
2. `server/database/seed.sql`

## 2. Atur koneksi backend

Masuk ke folder `server`, salin `.env.example` menjadi `.env`, lalu sesuaikan user/password MySQL:

```txt
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=siakad_smaga
CLIENT_ORIGIN=http://localhost:3000
CONTACT_TO_EMAIL=seccondgilang@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=alamat-gmail-pengirim@gmail.com
SMTP_PASS=app-password-gmail
```

Untuk `SMTP_PASS`, gunakan Gmail App Password, bukan password login Gmail biasa.

## 3. Install dan jalankan backend

```bash
cd server
npm install
npm run dev
```

Backend berjalan di `http://localhost:3001`.

## 4. Jalankan frontend

Buka terminal lain dari folder `app`:

```bash
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3000`.

## Akun contoh

- Admin: `admin` / `admin123`
- Guru:
  - `196805152000121002` / `hadi02`
  - `197203201998032005` / `siti05`
  - `198001102005012003` / `rina03`
- Siswa:
  - `0028374615` / `rizky15`
  - `0028374616` / `siti16`
  - `0028374617` / `budi17`

## Endpoint yang sudah tersedia

- `POST /api/login`
- `GET /api/siswa`
- `POST /api/siswa`
- `PUT /api/siswa/:nisn`
- `DELETE /api/siswa/:nisn`
- `GET /api/guru`
- `POST /api/guru`
- `PUT /api/guru/:nip`
- `DELETE /api/guru/:nip`
- `GET /api/dashboard/admin`
- `GET /api/dashboard/guru/:nip`
- `GET /api/dashboard/siswa/:nisn`
