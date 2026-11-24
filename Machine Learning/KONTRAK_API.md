# Kontrak API ML (untuk backend)

Bukan alat diagnosis medis.

## File yang dibawa (susunan folder jangan diubah)

```
models/deteksi_yolov8s_v3_bh_640.pt
models/model2_gabungan_warna_titik_v3.joblib
src/api.py  src/hasil_web.py  src/pipeline.py  src/ciri_jerawat.py  src/info_jenis.py
requirements.txt
```

## Menyalakan (Python 3.11, Windows PowerShell, dari folder proyek)

```
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn api:app --app-dir src --host 127.0.0.1 --port 8000
```

Dua baris pertama cukup sekali. Server siap setelah muncul `Application startup complete`.
Coba lewat browser: http://127.0.0.1:8000/docs

## POST /analisis

Body `multipart/form-data`, kolom `foto` (JPG/PNG, maksimal 15 MB). Nama file bebas.

```js
const form = new FormData();
form.append("foto", file);
const res = await fetch(process.env.ML_URL + "/analisis", { method: "POST", body: form });
const hasil = await res.json();
```

Jangan mengisi header `Content-Type` sendiri. Pakai batas waktu sekitar 60 detik.

Balasan 200 (angka asli dari satu foto uji, daftar `jerawat` dipotong):

```json
{
  "jumlah_jerawat": 4,
  "jerawat": [
    {
      "id": 0,
      "nomor_urut": 1,
      "kotak": [319.7, 110.4, 353.0, 168.6],
      "jenis": "Papules",
      "nomor": "3",
      "warna": "#e61e1e",
      "jenis_tebakan": "Papules",
      "yakin_jenis": 0.885,
      "yakin_deteksi": 0.572
    }
  ],
  "ringkasan": [
    {"nomor": "3", "jenis": "Papules", "warna": "#e61e1e", "jumlah": 4,
     "ciri": "Benjolan kecil merah, tanpa titik putih/kuning di tengah."}
  ],
  "catatan": "Bukan alat diagnosis medis.",
  "lebar_foto": 640,
  "tinggi_foto": 640,
  "foto_hasil": "/hasil/6d0912d47e71485a9d2be7eb761db494.jpg"
}
```

- Angka di kotak foto = `nomor_urut`. Warna kotak = `warna`.
- `nomor` = kode jenis (1 Blackheads, 2 Cyst, 3 Papules, 4 Pustules, 5 Whiteheads, ? Kurang yakin), bukan nomor kotak.
- `kotak` = x0, y0, x1, y1 dalam piksel foto asli. Foto hasil dikecilkan kalau sisi terpanjangnya lebih dari 1600.
- Tanpa jerawat: `jumlah_jerawat` 0, `jerawat` dan `ringkasan` kosong, `foto_hasil` tetap ada.

## GET /hasil/{nama}.jpg

Isi foto berkotak (`image/jpeg`). Alamat lengkap = `ML_URL` + `foto_hasil`.

## Kode error (isi: `{"detail": ...}`)

| Kode | Arti |
|---|---|
| 400 | File bukan foto JPG/PNG, atau nama foto tidak sah |
| 404 | Foto tidak ada |
| 413 | Foto lebih dari 15 MB |
| 422 | Kolom `foto` tidak dikirim |
| 500 | Kesalahan di server ML |

## Penyimpanan

- Foto berkotak langsung disimpan permanen di `hasil_foto/` dan tidak dihapus otomatis. Foto asli tidak disimpan ML.
- Saat pengguna klik Simpan, backend mencatat path foto dan data hasil ke database.
- API tidak punya login: biarkan di `127.0.0.1`, jangan dibuka ke internet.
