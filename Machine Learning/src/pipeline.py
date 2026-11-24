"""Alur 2 model tanpa tampilan (dipakai oleh app dan uji_cepat).

Model 1 (YOLOv8s, 1 kelas "Acne") mencari kotak jerawat.
Model 2 (Gabungan RF + ET + HGB, 60 ciri warna+titik) menebak jenis tiap kotak.
Bukan alat diagnosis medis.
"""
import os

import joblib
import numpy as np
from ultralytics import YOLO

from ciri_jerawat import ciri

PROYEK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOLDER_MODEL = os.path.join(PROYEK, 'models')
MODEL_DETEKSI = 'deteksi_yolov8s_v3_bh_640.pt'
MODEL_JENIS = 'model2_gabungan_warna_titik_v3.joblib'
# Model 2 dilatih dengan potongan pas kotak (tanpa dilebarkan), jadi di sini juga tidak dilebarkan.
LONGGAR = 0.0


def muat_deteksi(nama=MODEL_DETEKSI):
    return YOLO(os.path.join(FOLDER_MODEL, nama))


def muat_jenis(nama=MODEL_JENIS):
    paket = joblib.load(os.path.join(FOLDER_MODEL, nama))
    return paket['model'], list(paket['kelas'])


def potong(foto, x0, y0, x1, y1, longgar=LONGGAR):
    w, h = x1 - x0, y1 - y0
    return foto.crop((max(0, x0 - w * longgar), max(0, y0 - h * longgar),
                      min(foto.width, x1 + w * longgar), min(foto.height, y1 + h * longgar)))


def tebak_jenis(model, kelas, potongan):
    """Hasil: list (jenis, keyakinan, peluang semua kelas) untuk tiap potongan."""
    if not potongan:
        return []
    peluang = model.predict_proba(np.stack([ciri(p) for p in potongan]))
    return [(kelas[int(p.argmax())], float(p.max()), p) for p in peluang]


def jalankan(foto, detektor, model, kelas, conf=0.25, iou=0.45):
    """foto: PIL RGB. Hasil: list dict per jerawat."""
    kotak = detektor.predict(foto, imgsz=640, conf=conf, iou=iou, verbose=False)[0].boxes
    if not len(kotak):
        return []
    xyxy, skor = kotak.xyxy.tolist(), kotak.conf.tolist()
    potongan = [potong(foto, *b) for b in xyxy]
    return [{'kotak': b, 'conf': c, 'potongan': p, 'jenis': j, 'yakin': y, 'peluang': pr}
            for b, c, p, (j, y, pr) in zip(xyxy, skor, potongan, tebak_jenis(model, kelas, potongan))]


def jalankan_data(foto, detektor, model, kelas, conf=0.25, iou=0.45, ambang_jenis=0.5):
    """Sama dengan jalankan(), tapi hasilnya data biasa (bisa jadi JSON) untuk website.

    Isi: jumlah_jerawat, jerawat (kotak, nomor, warna, jenis, keyakinan), ringkasan (legenda).
    """
    from info_jenis import ke_data
    return ke_data(jalankan(foto, detektor, model, kelas, conf=conf, iou=iou), ambang_jenis)
