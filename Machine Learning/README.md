# Deteksi dan Klasifikasi Jenis Jerawat (versi bersih)

Salinan rapi dari `PROJECT AI - JERAWAT FINAL`: hanya model terbaik, kode latih, preprocessing, dataset, dan hasil terakhir.
Folder FINAL tidak diubah. Percobaan yang tidak menaikkan nilai (tambah Cyst v2, ciri CNN) tidak disalin, ringkasannya ada di bawah.

```
Foto wajah ──► Model 1: YOLOv8s (1 kelas "Acne") ──► kotak jerawat
           ──► tiap kotak dipotong ──► 60 ciri (warna + titik tengah)
           ──► Model 2: soft voting RF + ET + HGB ──► jenis (Blackheads, Cyst, Papules, Pustules, Whiteheads)
```
Bukan alat diagnosis medis.

## Model terbaik yang disertakan (`models/`)

| | Model 1: deteksi | Model 2: jenis |
|---|---|---|
| File | `deteksi_yolov8s_v3_bh_640.pt` (22 MB) | `model2_gabungan_warna_titik_v3.joblib` (93 MB) |
| Metode | YOLOv8s, 640 px | Machine learning klasik: RF + ET + HGB, 60 ciri |
| Data latih | `data/deteksi` train 1.781 foto + `data/deteksi_bh` train 434 foto | `data/jenis_v3/train` 8.618 gambar |
| Ujian | test lama 48 foto, test baru 108 foto | `test_potongan` 795 potongan |
| Nilai | test lama: mAP50 **0,651**, P 0,708, R 0,578, F1 0,637; test baru: mAP50 0,181, R 0,348 | akurasi **0,735**, macro F1 **0,715** |

F1 model 2 per jenis: Blackheads 0,82, Papules 0,75, Whiteheads 0,71, Pustules 0,69, Cyst 0,60.
F1 model 1 dihitung dari precision dan recall; akurasi tidak ada untuk model deteksi.

Catatan pemilihan model 1: model lain (YOLOv8n @640) sedikit lebih tinggi di test lama (0,663), tetapi selisihnya hanya 0,012 (di bawah noise dengan 48 foto)
dan jauh lebih rendah di test baru (0,132 vs 0,181), sehingga YOLOv8s dipakai.

## Isi folder

| Folder | Isi |
|---|---|
| `models/` | kedua model terbaik di atas |
| `app/app.py` | aplikasi Streamlit (upload foto, kotak, nomor dan warna tetap per jenis, legenda) |
| `src/` | `pipeline.py` (model 1 ke model 2), `ciri_jerawat.py` (60 ciri), `info_jenis.py` (nomor, warna, JSON untuk website), `uji_cepat.py`, `persiapan_data/` (cara dataset jenis dibuat) |
| `data/deteksi/` | dataset model 1 (YOLO, 1 kelas): train 1.781, valid 56, test 48 foto |
| `data/deteksi_bh/` | foto Blackheads: train 434, test 108; `jenis_asli_test.json` = jenis asli tiap kotak test |
| `data/jenis_v3/` | dataset model 2: train 8.618, val 872, test_potongan 795, test (close-up) 76; `manifest_potongan_v2.csv`, `dibuang_v3.csv`, `ringkasan.json` |
| `notebooks/` | kode latih dan preprocessing (tabel di bawah) |
| `hasil/` | hasil terakhir: `model1/hasil_ujian.csv`; `model2/` (nilai val dan ujian, matriks kebingungan, file 60 ciri, tuning) |
| `riwayat_training/` | log training YOLOv8n (run sejenis dengan model 1). Log YOLOv8s ada di Google Drive (`acne_det_runs/deteksi_v3_bh_v8s_640`), belum disalin |

## Notebook (urutan dibaca dan dijalankan)

| Notebook | Isi | Dijalankan di |
|---|---|---|
| `model1_deteksi/1_eda_deteksi` | EDA dataset deteksi | lokal |
| `model1_deteksi/2_preprocessing_training_colab` | preprocessing foto Blackheads (buang kembar, isi label) dan **training model 1** | **Colab (GPU)** |
| `model1_deteksi/3_evaluasi_deteksi` | mAP50, precision, recall, recall per jenis | lokal (CPU) |
| `model2_jenis/1_eda_jenis` | EDA dataset jenis | lokal |
| `model2_jenis/2_preprocessing_ciri` | ubah potongan jadi 60 ciri | lokal |
| `model2_jenis/3_training_pilih_model` | latih dan pilih model (pilih dengan val) | lokal |
| `model2_jenis/4_evaluasi_jenis` | ujian sekali, matriks kebingungan | lokal |
| `model2_jenis/7_tuning_parameter` | tuning RF/ET/HGB (tidak menaikkan nilai, model tetap) | lokal |
| `3_alur_2_model` | alur dua model pada foto | lokal |

Notebook mencari folder proyek dengan naik ke atas sampai ada `models` dan `data`, jadi tidak perlu mengubah path.
Pesan galatnya masih menyebut "FINAL"; itu hanya teks.

## Menyiapkan environment baru

```
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
streamlit run app\app.py
```
Versi pustaka di `requirements.txt` sama dengan yang dipakai saat melatih (penting untuk file `.joblib`).
Uji cepat tanpa aplikasi: `python src\uji_cepat.py "foto.jpg"` (`--json` untuk keluaran seperti yang dikirim ke website).

## Cara menjaga penilaian tetap jujur

- Data dibagi per foto: potongan dari foto yang sama tidak ada di train dan ujian sekaligus.
- Soal val/ujian yang mirip gambar train (dibalik/diputar Roboflow) dibuang (`jenis_v3`).
- Model dipilih dengan val; ujian dipakai sekali di akhir. Selisih di bawah sekitar 0,005 dianggap noise.
- Dataset tambahan yang ternyata berisi foto yang sama dengan ujian tidak dipakai.

## Percobaan yang tidak disalin (masih ada di folder FINAL)

| Percobaan | Hasil |
|---|---|
| Tambah 152 potongan Cyst dari dataset v2 (notebook 5 dan 6) | recall Cyst naik, tetapi Papules yang ditebak Cyst ikut naik; tidak ada keuntungan bersih |
| Ciri ukuran relatif (skrip percobaan, bukan notebook) | val macro F1 0,715-0,722 (vs 0,727-0,731 tanpa ukuran); tidak naik |
| Ciri CNN ResNet18 (notebook 8, Colab) | lebih buruk: val macro F1 A (60 ciri) 0,722, B (CNN saja) 0,591, C (60+CNN) 0,674, D (60+CNN-PCA) 0,699 |
| Model 1 dengan resolusi 960 (YOLOv8n) | test lama 0,614, test baru 0,148; tidak menolong |

## Batasan

- Foto dataset kecil (paling besar 640 px, separuh data latih 416 px), jadi jerawat kecil (titik hitam/putih) sulit terdeteksi: recall Whitehead 0,11 dan Blackhead 0,24 di test baru.
- Model 1 turun jauh pada foto dari sumber lain (mAP50 0,651 menjadi 0,181).
- Label antar sumber dataset tidak konsisten; sebagian jerawat tidak dikotak. Dataset `deteksi_v4` (label sudah diperbaiki di Roboflow) ada di folder `PROJECT AI - DETEKSI JENIS JERAWAT V3`, belum disalin ke sini, dan model v4 belum dilatih.
- Foto latih yang benar-benar berbeda sekitar 1.470 (sisanya salinan augmentasi), Blackheads sekitar 240.
- Model 2 hanya mengenal 5 jenis; Cyst paling sulit (F1 0,60), terutama tertukar dengan Papules.
- Target tim "80%" belum jelas mengacu ke metrik apa; nilai sekarang belum mencapainya.

## Sumber data (semua CC BY 4.0, Roboflow Universe)

| Dataset | Dipakai untuk |
|---|---|
| "skin-detection-uvj1f" v8 (osman-kagan-kurnaz) | deteksi: train, valid, test |
| "acne-detection-yolo" v1 (acne-severity) | deteksi: train |
| "Acne new data" v1 (15 kelas) | foto Blackheads (`deteksi_bh`) dan potongan jenis (`jenis_v3`) |
| AcneDataset dan "Acne2" v1 | foto close-up di `jenis_v3` |
