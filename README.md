<div align="center">

# 🎓 SIAKAD
### Sistem Informasi Akademik Sekolah Berbasis Web

Sistem informasi akademik modern untuk mengelola data siswa, guru, kelas, absensi, nilai, jadwal, tugas, dan administrasi sekolah secara terintegrasi.

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=for-the-badge&logo=bootstrap)

![License](https://img.shields.io/github/license/NouzenXCS/siakad?style=flat-square)
![Stars](https://img.shields.io/github/stars/NouzenXCS/siakad?style=flat-square)
![Forks](https://img.shields.io/github/forks/NouzenXCS/siakad?style=flat-square)

</div>

---

## 📖 Tentang Proyek

SIAKAD merupakan aplikasi berbasis web yang dirancang untuk membantu sekolah dalam mengelola berbagai aktivitas akademik secara digital. Sistem ini menyediakan fitur pengelolaan data siswa, guru, kelas, absensi, nilai, tugas, pengumuman, serta prestasi siswa dengan mekanisme akses berdasarkan peran pengguna.

### 👥 Role Pengguna

| Role | Hak Akses |
|--------|-----------|
| Admin | Mengelola seluruh data sistem |
| Guru | Mengelola absensi, tugas, nilai, dan pengumuman |
| Siswa | Melihat jadwal, tugas, nilai, absensi, dan pengumuman |

---

## ✨ Fitur Utama

### 📚 Manajemen Akademik

- 👨‍🎓 Manajemen Siswa
- 👨‍🏫 Manajemen Guru
- 🏫 Manajemen Kelas
- 📅 Manajemen Jadwal
- 📝 Manajemen Nilai
- 📌 Manajemen Tugas
- 📥 Pengumpulan Tugas
- 📢 Pengumuman Sekolah
- 🏆 Manajemen Prestasi
- 📊 Dashboard Statistik

### 🔐 Sistem Hak Akses

- Multi Role Authentication
- Role Based Access Control (RBAC)
- Session Management

### 📈 Monitoring

- Statistik Kehadiran
- Rekap Nilai
- Data Akademik Real-Time
- Visualisasi Data

---

## 🛠️ Teknologi yang Digunakan

### Frontend

| Teknologi | Fungsi |
|------------|---------|
| React | Library UI |
| TypeScript | Type Safety |
| Vite | Build Tool |
| React Router | Routing |
| Bootstrap 5 | Styling |
| Bootstrap Icons | Icon |
| Radix UI | UI Components |

### Backend

| Teknologi | Fungsi |
|------------|---------|
| Node.js | Runtime |
| Express.js | REST API |
| mysql2 | Database Driver |
| dotenv | Environment Variables |
| nodemailer | Email Service |
| cors | Cross-Origin Request |

### Database

- MySQL
- MariaDB

### Library Tambahan

- xlsx
- date-fns
- recharts
- sonner

---

## 📂 Struktur Folder

```bash
siakad/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── routes/
│   │
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── server.js
│
├── database/
│   └── siakad_smaga.sql
│
└── README.md
```

---

## ⚙️ Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/NouzenXCS/siakad.git

cd siakad
```

### 2. Install Dependency

```bash
npm install
```

### 3. Konfigurasi Environment

Buat file `.env`

```env
VITE_API_BASE_URL=http://localhost:3001/api

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=siakad

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password
```

### 4. Import Database

Import file:

```text
database/siakad_smaga.sql
```

ke dalam:

- phpMyAdmin
- MySQL Workbench
- DBeaver
- HeidiSQL

### 5. Menjalankan Aplikasi

Frontend

```bash
npm run dev
```

Backend

```bash
npm start
```

atau

```bash
node server.js
```

---

## 🚀 Deployment

| Komponen | Teknologi |
|-----------|------------|
| Hosting | DomaiNesia Nimbus Go |
| Web Server | Apache |
| Control Panel | cPanel |
| Runtime | CloudLinux Passenger Node.js |
| Frontend | React + Vite |
| Backend | Express.js |
| Database | MySQL |

---

## 📊 Modul Sistem

| Modul | Deskripsi |
|---------|-----------|
| Siswa | Mengelola data siswa |
| Guru | Mengelola data guru |
| Kelas | Mengelola data kelas |
| Jadwal | Mengelola jadwal pelajaran |
| Absensi | Mengelola kehadiran siswa |
| Nilai | Mengelola nilai akademik |
| Tugas | Mengelola tugas siswa |
| Pengumuman | Informasi sekolah |
| Prestasi | Data prestasi siswa |

---

## 👨‍💻 Pengembang

### M. Rafif Akbar Zhafiri

- GitHub: https://github.com/Rafif-Akbar

---

## ⭐ Dukungan

Jika proyek ini bermanfaat, jangan lupa untuk memberikan **Star ⭐** pada repository ini.

---