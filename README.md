
![SGM Hadir](sgm_hadir_mobile/assets/icon/app_icon.png)

# SGM Hadir — Aplikasi Absensi Karyawan

Sistem absensi digital untuk **PT Salut Gajah Mada** yang terdiri dari **3 platform**:

| Platform | Teknologi | Fungsi |
|----------|-----------|--------|
| 📱 **Mobile** (Android) | Flutter + Dart | Absensi check-in/out, QR scan, izin, lembur |
| ⚙️ **Backend API** | Go (Gin + GORM) | REST API, validasi GPS, push notifikasi, database |
| 🖥️ **Admin Web** | React + TypeScript + Vite | Dashboard, manajemen karyawan/cabang/shift, laporan |
| 🔥 **Cloud Functions** | Firebase (Node.js) | Auth triggers, validasi, export Excel/PDF |

---

## Daftar Isi

- [Fitur Lengkap](#fitur-lengkap)
- [Arsitektur](#arsitektur)
- [Teknologi](#teknologi)
- [Cara Install](#cara-install)
  - [1. Prasyarat](#1-prasyarat)
  - [2. Database (Docker)](#2-database-docker)
  - [3. Backend](#3-backend)
  - [4. Mobile (Flutter)](#4-mobile-flutter)
  - [5. Admin Web](#5-admin-web)
  - [6. Firebase (Opsional)](#6-firebase-opsional)
- [API Documentation](#api-documentation)
- [Struktur Folder](#struktur-folder)
- [Pengaturan Awal](#pengaturan-awal)
- [Screenshot](#screenshot)
- [Lisensi](#lisensi)

---

## Fitur Lengkap

### 📱 Mobile (Karyawan)

| Fitur | Keterangan |
|-------|-----------|
| **Check-in / Check-out** | Absen masuk/pulang dengan **GPS** dan **Selfie** |
| **Validasi Radius GPS** | Otomatis cek jarak dari kantor menggunakan rumus **Haversine** |
| **QR Code Check-in** | Scan QR khusus untuk absen di cabang/event tertentu |
| **Dark Mode** | Tampilan gelap/terang bisa di-toggle dari profil |
| **Izin & Cuti** | Ajukan izin/cuti langsung dari HP, upload lampiran |
| **Lembur** | Ajukan lembur beserta estimasi jam |
| **Riwayat Absensi** | Lihat histori check-in/out |
| **Dashboard Personal** | Statistik hadir, terlambat, izin, lembur, **leaderboard** peringkat karyawan |
| **Profil** | Edit profil, ganti password, lihat **sisa kuota cuti tahunan** |
| **Pengingat Check-in** | Notifikasi otomatis jam 08:00 jika belum absen |
| **Pengingat Check-out** | Notifikasi jam 17:00 jika belum absen pulang |
| **Auto Check-out** | Sistem auto absen pulang jam 18:00 tanpa validasi GPS |
| **Kuota Cuti** | Jika kuota habis, tidak bisa ajukan cuti — harus lapor supervisor |

### 🖥️ Admin Web

| Fitur | Keterangan |
|-------|-----------|
| **Dashboard** | Total karyawan, hadir hari ini, belum absen, terlambat, izin |
| **Log Absensi** | Riwayat absensi dengan filter tanggal, cabang, tipe |
| **Manajemen Karyawan** | CRUD karyawan, assign cabang & shift |
| **Manajemen Cabang** | CRUD cabang dengan koordinat GPS & radius |
| **Manajemen Shift** | Buat shift, assign ke karyawan |
| **Approval Izin & Lembur** | Approve/reject pengajuan dengan catatan |
| **Laporan** | Export Excel rekap absensi & laporan |
| **Pengaturan** | Jam kerja, notifikasi (toggle **notif check-in/admin/pengajuan**), header laporan |
| **Manajemen Role** | Atur permission per role |
| **Notifikasi Realtime** | FCM push notif ke browser untuk: check-in karyawan, pengajuan baru |

### ⚙️ Backend

| Fitur | Keterangan |
|-------|-----------|
| **REST API** | Gin Framework dengan JWT auth & rate limiter |
| **Validasi GPS** | Haversine distance + radius branch |
| **FCM Push Notification** | Notifikasi check-in reminder, check-out reminder, auto check-out, admin check-in, pengajuan baru |
| **Auto Check-out** | Karyawan yang lupa absen pulang di-auto-check-out pukul 18:00 (skip GPS) |
| **Leaderboard** | Ranking on-time & terlambat per tahun |
| **Role-based Access** | super_admin, supervisor, kepala_salut, manajer_salut, employee |
| **Redis** | Caching & rate limiter |
| **PostgreSQL** | Database utama dengan migrasi SQL |

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile (Flutter)                         │
│  Check-in/out  │  QR Scanner  │  Izin/Lembur  │  History       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (REST API)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Go / Gin)                          │
│  Auth  │  Attendance  │  Leave  │  Overtime  │  Notification   │
│  GPS Validation  │  Leaderboard  │  Settings  │  WebSocket      │
└──────┬──────────────────────┬───────────────────────────────────┘
       │                      │
       ▼                      ▼
┌──────────┐          ┌──────────┐        ┌──────────────────────┐
│PostgreSQL│          │  Redis   │        │  Firebase (FCM)      │
│  Database│          │  Cache   │        │  Push Notification   │
└──────────┘          └──────────┘        └──────────────────────┘
       ▲
       │
┌──────┴──────────────────────────────────────────────────────────┐
│                   Admin Web (React + Vite)                      │
│  Dashboard  │  Logs  │  CRUD  │  Approval  │  Reports  │  Settings│
└─────────────────────────────────────────────────────────────────┘
```

---

## Teknologi

### Backend (`backend/`)
| Teknologi | Versi |
|-----------|-------|
| Go | 1.25 |
| Gin | v1 |
| GORM | v2 |
| PostgreSQL | 15 |
| Redis | 7 |
| Firebase Admin SDK | - |
| Docker | - |

### Mobile (`sgm_hadir_mobile/`)
| Teknologi | Versi |
|-----------|-------|
| Flutter | 3.44 |
| Dart | 3.12 |
| Dio | HTTP Client |
| flutter_bloc | State Management |
| mobile_scanner | QR Scanner |
| geolocator | GPS |
| image_picker | Camera/Gallery |
| firebase_messaging | Push Notification |
| cached_network_image | Image Cache |

### Admin Web (`sgm_hadir_admin/`)
| Teknologi | Versi |
|-----------|-------|
| React | 19 |
| TypeScript | 5.7 |
| Vite | 8 |
| Tailwind CSS | 4 |
| React Router DOM | v7 |
| Axios | HTTP Client |
| Recharts | Grafik |
| Firebase | 12 (Auth, FCM) |
| react-hot-toast | Notifikasi |
| lucide-react | Ikon |

### Firebase (`firebase/`)
| Layanan | Fungsi |
|---------|--------|
| Cloud Messaging (FCM) | Push notification |
| Cloud Functions | Auth trigger, validasi, export |
| Firestore | Real-time data (fungsi tambahan) |
| Storage | Upload file |

---

## Cara Install

### 1. Prasyarat

| Tools | Minimal Versi | Download |
|-------|---------------|----------|
| Go | 1.23+ | https://go.dev/dl/ |
| Flutter | 3.24+ | https://docs.flutter.dev/get-started/install |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop/ |
| Node.js | 20+ | https://nodejs.org/ |
| Android Studio | - | https://developer.android.com/studio |
| Git | - | https://git-scm.com/ |

### 2. Clone & Persiapan

```bash
git clone https://github.com/anoliz13/sgm-hadir.git
cd sgm-hadir
```

### 3. Database (Docker)

```bash
cd backend
docker-compose up -d
```

Ini akan menjalankan:
- **PostgreSQL 15** di port `5432`
  - Database: `sgm_hadir`
  - User: `sgm_admin`
  - Password: `sgm_secret`
- **Redis 7** di port `6379`

### 4. Backend

```bash
cd backend

# Copy environment
cp .env.example .env

# Sesuaikan konfigurasi di .env
DATABASE_URL=postgres://sgm_admin:sgm_secret@localhost:5432/sgm_hadir?sslmode=disable
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=ubah_dengan_secret_rahasia
PORT=8080

# Install dependencies & jalankan
go mod download
go run cmd/server/main.go
```

Backend akan berjalan di `http://localhost:8080`.

### 5. Mobile (Flutter)

```bash
cd sgm_hadir_mobile

# Install dependencies
flutter pub get

# Jalankan di emulator/device
flutter run
```

**Konfigurasi API URL:**
Edit `lib/core/constants/api_constants.dart`:
```dart
class ApiConstants {
  // Untuk Android Emulator
  static const String baseUrl = 'http://10.0.2.2:8080/api/v1';
  // Untuk device fisik, ganti dengan IP komputer:
  // static const String baseUrl = 'http://192.168.x.x:8080/api/v1';
}
```

### 6. Admin Web

```bash
cd sgm_hadir_admin

# Install dependencies
npm install

# Copy environment
cp .env.example .env   # (jika ada)

# Jalankan development server
npm run dev
```

Akses di browser: `http://localhost:5173`

**Konfigurasi Firebase (untuk push notification):**
1. Buat project di [Firebase Console](https://console.firebase.google.com/)
2. Daftarkan Web App → Copy config
3. Edit `src/lib/firebase.ts` → ganti `YOUR_*` dengan config asli
4. Daftarkan Android App → Download `google-services.json`
5. Copy ke `sgm_hadir_mobile/android/app/google-services.json`
6. Generate VAPID key: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
7. Set `VITE_FCM_VAPID_KEY` di `.env`

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_FCM_VAPID_KEY=BC...vapid_key_anda...ZQ
```

### 7. Firebase Cloud Functions (Opsional)

```bash
cd firebase/functions
npm install

# Login Firebase
npx firebase login

# Deploy functions
npx firebase deploy --only functions
```

---

## API Documentation

### Authentication

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Login dengan NIK & password |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/users/me` | Profile user |
| PUT | `/api/v1/profile` | Update profile |
| PUT | `/api/v1/profile/fcm-token` | Update FCM token |

### Attendance

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/attendance/check-in` | Check-in (GPS + selfie) |
| POST | `/api/v1/attendance/check-out` | Check-out (GPS) |
| GET | `/api/v1/attendance/my-today` | Status absen hari ini |
| GET | `/api/v1/attendance/dashboard` | Statistik + leaderboard |
| GET | `/api/v1/attendance/my-history` | Riwayat absensi |

### Leave & Overtime

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/leaves` | Ajukan izin/cuti |
| GET | `/api/v1/leaves` | Pengajuan saya |
| GET | `/api/v1/leaves/types` | Tipe-tipe izin |
| GET | `/api/v1/leaves/my-quota` | Sisa kuota cuti |
| POST | `/api/v1/overtimes` | Ajukan lembur |
| GET | `/api/v1/overtimes` | Pengajuan lembur saya |

### Admin Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/admin/dashboard/summary` | Ringkasan dashboard admin |
| GET | `/api/v1/admin/attendances` | Semua log absensi |
| GET | `/api/v1/admin/employees` | Manajemen karyawan |
| POST | `/api/v1/admin/branches` | CRUD cabang |
| PUT | `/api/v1/admin/leaves/:id/status` | Approve/reject izin |
| PUT | `/api/v1/admin/overtimes/:id/status` | Approve/reject lembur |
| GET | `/api/v1/admin/settings` | Pengaturan sistem |
| PUT | `/api/v1/admin/settings` | Update pengaturan |
| GET | `/api/v1/admin/reports/export/excel` | Export Excel |

---

## Struktur Folder

```
sgm-hadir/
├── backend/                          # Go Backend API
│   ├── cmd/
│   │   ├── server/main.go            # Entry point server
│   │   ├── seed/main.go              # Seeder data awal
│   │   └── seed_leave_types/main.go  # Seeder tipe izin
│   ├── internal/
│   │   ├── dto/                      # Data Transfer Objects
│   │   ├── handler/                  # HTTP Handlers
│   │   ├── middleware/               # Auth, rate limiter
│   │   ├── model/                    # Database models
│   │   ├── repository/               # Database queries
│   │   └── service/                  # Business logic
│   │       ├── attendance_service.go # GPS validasi, leaderboard
│   │       ├── notification_service.go # FCM, auto check-out
│   │       ├── leave_service.go      # Izin & cuti
│   │       ├── overtime_service.go   # Lembur
│   │       └── gps_service.go        # Haversine distance
│   ├── pkg/                          # Shared packages
│   │   ├── fcm/                      # Firebase Cloud Messaging
│   │   ├── jwt/                      # JWT auth
│   │   ├── hash/                     # Password hashing
│   │   ├── postgres/                 # Database connection
│   │   ├── redis/                    # Redis connection
│   │   └── excel/                    # Excel generator
│   ├── migrations/                   # SQL migrations
│   ├── docker-compose.yml
│   └── go.mod
│
├── sgm_hadir_mobile/                 # Flutter Mobile App
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app.dart                  # Entry, BLoC providers
│   │   ├── core/
│   │   │   ├── constants/            # API URLs, colors
│   │   │   ├── network/              # Dio client
│   │   │   ├── theme/                # Dark/light mode
│   │   │   └── services/             # FCM notification service
│   │   ├── data/
│   │   │   ├── datasources/          # HTTP calls
│   │   │   ├── models/               # JSON models
│   │   │   └── repositories/         # Data repositories
│   │   └── presentation/
│   │       ├── auth/                 # Login
│   │       ├── home/                 # Dashboard + absen
│   │       ├── leave/                # Izin & cuti
│   │       ├── overtime/             # Lembur
│   │       ├── profile/              # Profil + kuota cuti
│   │       ├── history/              # Riwayat absen
│   │       ├── qr/                   # QR scanner
│   │       ├── admin/                # Admin panel mobile
│   │       └── splash/               # Splash screen
│   └── pubspec.yaml
│
├── sgm_hadir_admin/                  # React Admin Web
│   ├── src/
│   │   ├── App.tsx                   # Routing + FCM init
│   │   ├── main.tsx                  # Entry point
│   │   ├── components/               # UI components
│   │   ├── contexts/                 # Auth context
│   │   ├── hooks/                    # Custom hooks (FCM, WS)
│   │   ├── lib/                      # API, Firebase, types
│   │   ├── pages/                    # Page components
│   │   └── assets/                   # Images, icons
│   ├── public/
│   │   └── firebase-messaging-sw.js  # FCM service worker
│   └── package.json
│
└── firebase/                         # Firebase Cloud
    ├── functions/
    │   └── src/
    │       ├── index.ts              # Entry point
    │       ├── auth/                 # User creation
    │       ├── attendance/           # Validasi check-in
    │       ├── approval/             # Notif approval
    │       ├── reports/              # Export
    │       └── seed/                 # Seed data
    └── firestore.rules
```

---

## Pengaturan Awal

### Seeder Data

Setelah backend & database jalan, jalankan seeder untuk data awal:

```bash
cd backend

# Seeder user & data awal
go run cmd/seed/main.go

# Seeder tipe izin
go run cmd/seed_leave_types/main.go
```

### Akun Default (setelah seeder)

| Role | NIK | Password |
|------|-----|----------|
| Super Admin | `ADMIN001` | `admin123` |
| Karyawan | `KRY001` | `karyawan123` |

### QR Code Format

Untuk QR Check-in, format yang digunakan:
```
SGMHADIR|{branch_id}|{timestamp}
```

Contoh:
```
SGMHADIR|550e8400-e29b-41d4-a716-446655440000|2026-06-10T08:00:00Z
```

---

## Screenshot

| Mobile | Admin Web |
|--------|-----------|
| Login & Absensi | Dashboard |
| QR Scanner | Log Absensi |
| Riwayat | Approval |
| Profil & Cuti | Pengaturan |

*(Screenshot akan ditambahkan setelah deploy)*

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=8080
GIN_MODE=debug
DATABASE_URL=postgres://sgm_admin:sgm_secret@localhost:5432/sgm_hadir?sslmode=disable
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=ubah_dengan_secret_acak
JWT_EXPIRY_HOURS=24
FIREBASE_CREDENTIALS_PATH=firebase-adminsdk.json
```

### Admin Web (`sgm_hadir_admin/.env`)

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_FCM_VAPID_KEY=BC...vapid_key_anda...ZQ
VITE_USE_EMULATORS=false
```

---

## Kontributor

- **anoliz13** — Developer

---

## Lisensi

Hak Cipta © 2026 PT Salut Gajah Mada. Semua hak dilindungi.

Aplikasi ini dikembangkan untuk keperluan internal perusahaan. Dilarang mendistribusikan atau menggunakan tanpa izin tertulis.
